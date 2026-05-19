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

// ─── POST /api/checkin/scan — check in by QR token ───────────────────────────
router.post('/scan', async (req, res, next) => {
  try {
    const { token, agent } = req.body

    if (!token) return res.status(400).json({ error: 'Token requis' })

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('id, token, statut, heure_arrivee, invites(prenom, nom, organisation)')
      .eq('token', token)
      .single()

    if (error || !invitation) {
      return res.status(404).json({ error: 'Invitation introuvable — token invalide' })
    }

    await performCheckin(invitation, agent, res)
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
