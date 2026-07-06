import { Router } from 'express'
import supabase from '../config/supabase.js'

const router = Router()

/**
 * Helper: format a date as HH:MM in local time
 */
function formatTime(date) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Core check-in logic shared by /scan and /manual/:id
 * @param {object} invitation - full invitation row including invites relation
 * @param {string} agent - agent name (optional)
 * @param {object} res - Express response
 */
async function performCheckin(invitation, agent, res) {
  const { statut, id: invitation_id } = invitation

  // Already checked in
  if (statut === 'present') {
    const time = invitation.heure_arrivee ? formatTime(invitation.heure_arrivee) : '?'
    return res.status(409).json({
      error: `Déjà scanné à ${time}`,
      statut: 'present',
      heure_arrivee: invitation.heure_arrivee
    })
  }

  // Declined
  if (statut === 'decline') {
    // Log the failed attempt
    await supabase.from('checkins').insert({
      invitation_id,
      agent: agent || null,
      success: false,
      message: 'Invité a décliné'
    })
    return res.status(422).json({
      error: 'Invité a décliné',
      statut: 'decline'
    })
  }

  const now = new Date().toISOString()

  // Update invitation to 'present'
  const { data: updated, error: updateErr } = await supabase
    .from('invitations')
    .update({
      statut: 'present',
      heure_arrivee: now,
      agent_checkin: agent || null
    })
    .eq('id', invitation_id)
    .select('id, statut, heure_arrivee, agent_checkin, invites(prenom, nom, organisation)')
    .single()

  if (updateErr) throw updateErr

  // Log successful check-in
  await supabase.from('checkins').insert({
    invitation_id,
    agent: agent || null,
    success: true,
    message: 'Check-in réussi'
  })

  return res.json({
    ok: true,
    statut: 'present',
    heure_arrivee: updated.heure_arrivee,
    agent_checkin: updated.agent_checkin,
    invite: updated.invites
  })
}

// ─── POST /api/checkin/scan — check in by QR token or guest name ──────────────
router.post('/scan', async (req, res, next) => {
  try {
    const { token, agent, evenement_id } = req.body

    if (!token) return res.status(400).json({ error: 'Token ou nom requis' })

    const cleanToken = token.trim()
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

    if (uuidRegex.test(cleanToken)) {
      // Recherche par token UUID (insensible à la casse)
      const { data: invitation, error } = await supabase
        .from('invitations')
        .select('id, token, statut, heure_arrivee, evenement_id, invites(prenom, nom, organisation)')
        .eq('token', cleanToken.toLowerCase())
        .single()

      if (error || !invitation) {
        return res.status(404).json({ error: 'Invitation introuvable — QR code ou token invalide' })
      }

      // Validation de l'événement cible
      if (evenement_id && invitation.evenement_id !== evenement_id) {
        return res.status(400).json({ error: 'Cette invitation appartient à un autre événement' })
      }

      await performCheckin(invitation, agent, res)
    } else {
      // Recherche nominative (Nom ou Prénom) pour saisie manuelle
      if (!evenement_id) {
        return res.status(400).json({ error: 'L\'ID de l\'événement est requis pour la recherche par nom.' })
      }

      const searchTerms = cleanToken.toLowerCase().split(/\s+/).filter(Boolean)
      if (searchTerms.length === 0) {
        return res.status(400).json({ error: 'Recherche invalide' })
      }

      // Récupérer toutes les invitations de l'événement pour faire un filtrage robuste en mémoire
      const { data: invitations, error } = await supabase
        .from('invitations')
        .select('id, token, statut, heure_arrivee, evenement_id, invites!inner(prenom, nom, organisation)')
        .eq('evenement_id', evenement_id)

      if (error || !invitations) {
        console.error('Erreur Supabase recherche nom:', error)
        return res.status(500).json({ error: 'Erreur lors de la récupération des invitations' })
      }

      // Filtrer en mémoire pour supporter "Prénom Nom" ou recherche partielle multi-mots
      const matched = invitations.filter((inv) => {
        const prenom = (inv.invites?.prenom || '').toLowerCase()
        const nom = (inv.invites?.nom || '').toLowerCase()
        const fullName = `${prenom} ${nom}`
        return searchTerms.every(term => prenom.includes(term) || nom.includes(term) || fullName.includes(term))
      })

      if (matched.length === 0) {
        return res.status(404).json({ error: 'Aucun invité trouvé avec ce nom pour cet événement' })
      }

      if (matched.length > 1) {
        return res.status(300).json({
          error: 'Plusieurs correspondances trouvées',
          matches: matched.map(m => ({
            id: m.id,
            prenom: m.invites?.prenom,
            nom: m.invites?.nom,
            organisation: m.invites?.organisation
          }))
        })
      }

      await performCheckin(matched[0], agent, res)
    }
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/checkin/manual/:invitation_id — check in by ID ─────────────────
router.post('/manual/:invitation_id', async (req, res, next) => {
  try {
    const { invitation_id } = req.params
    const { agent } = req.body

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('id, token, statut, heure_arrivee, invites(prenom, nom, organisation)')
      .eq('id', invitation_id)
      .single()

    if (error || !invitation) {
      return res.status(404).json({ error: 'Invitation introuvable' })
    }

    await performCheckin(invitation, agent, res)
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/checkin/:evenement_id/log — recent check-ins for an event ───────
router.get('/:evenement_id/log', async (req, res, next) => {
  try {
    const { evenement_id } = req.params
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)

    // Join checkins → invitations → invites, filtered by event
    const { data, error } = await supabase
      .from('checkins')
      .select(`
        id,
        scanned_at,
        agent,
        success,
        message,
        device_info,
        invitations (
          id,
          token,
          statut,
          heure_arrivee,
          evenement_id,
          invites ( prenom, nom, email, organisation, titre_poste )
        )
      `)
      .eq('invitations.evenement_id', evenement_id)
      .order('scanned_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Filter out any rows where the join didn't match the event
    const filtered = (data || []).filter(
      (row) => row.invitations && row.invitations.evenement_id === evenement_id
    )

    res.json(filtered)
  } catch (err) {
    next(err)
  }
})

export default router
