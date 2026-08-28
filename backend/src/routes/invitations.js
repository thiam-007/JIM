import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import supabase from '../config/supabase.js'
import { sendInvitation } from '../services/emailService.js'
import { generateQrPng } from '../services/qrService.js'
import { normalizeEmail } from '../utils/emailValidator.js'
import { authMiddleware, requireAdmin } from '../middleware/auth.js'
import { recordAudit } from '../utils/audit.js'

const router = Router()

router.use(authMiddleware, requireAdmin)

// ─── List invitations (with optional evenement_id filter) ──────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { evenement_id } = req.query

    let query = supabase
      .from('invitations')
      .select(`
        id,
        token,
        statut,
        date_envoi,
        date_reponse,
        expires_at,
        revoked_at,
        heure_arrivee,
        notes_rsvp,
        created_at,
        invite_id,
        invites ( id, prenom, nom, email, organisation, titre_poste, categorie ),
        evenements ( titre, date_debut )
      `)
      .order('created_at', { ascending: false })

    if (evenement_id) {
      query = query.eq('evenement_id', evenement_id)
    }

    const { data, error } = await query

    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Create invitation(s) ──────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { evenement_id, invite_ids } = req.body

    if (!evenement_id) return res.status(400).json({ error: 'evenement_id requis' })
    if (!Array.isArray(invite_ids) || invite_ids.length === 0) {
      return res.status(400).json({ error: 'invite_ids doit être un tableau non vide' })
    }

    // Build records — one per invite_id with a fresh UUID token
    // Normalize token to lowercase for consistency
    const records = invite_ids.map((invite_id) => ({
      evenement_id,
      invite_id,
      token: uuidv4().toLowerCase()
    }))

    const { data, error } = await supabase
      .from('invitations')
      .insert(records)
      .select(`
        id,
        token,
        statut,
        date_envoi,
        created_at,
        invite_id,
        invites ( id, prenom, nom, email ),
        evenements ( titre, date_debut )
      `)

    if (error) throw error

    res.status(201).json({
      created: data.length,
      invitations: data
    })
  } catch (err) {
    next(err)
  }
})

// ─── Reissue / revoke QR token ───────────────────────────────────────────────
router.post('/:id/reissue', async (req, res, next) => {
  try {
    const token = uuidv4().toLowerCase()
    const { data, error } = await supabase
      .from('invitations')
      .update({ token, revoked_at: null })
      .eq('id', req.params.id)
      .select('id, token, statut, expires_at, revoked_at')
      .single()

    if (error) throw error
    await recordAudit(req, { action: 'qr_reissued', entityType: 'invitation', entityId: req.params.id })
    if (!data) return res.status(404).json({ error: 'Invitation introuvable' })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/:id/revoke', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id, token, revoked_at')
      .single()

    if (error) throw error
    await recordAudit(req, { action: 'qr_revoked', entityType: 'invitation', entityId: req.params.id })
    if (!data) return res.status(404).json({ error: 'Invitation introuvable' })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Delete invitation ─────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { error: checkinsError } = await supabase
      .from('checkins')
      .delete()
      .eq('invitation_id', req.params.id)

    if (checkinsError) throw checkinsError

    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// ─── Send invitation emails ────────────────────────────────────────────────────
router.post('/send', async (req, res, next) => {
  try {
    const { invitation_ids, reminder = false } = req.body

    if (!Array.isArray(invitation_ids) || invitation_ids.length === 0) {
      return res.status(400).json({ error: 'invitation_ids doit être un tableau non vide' })
    }

    // Fetch invitations with related data
    const { data: invitations, error: fetchErr } = await supabase
      .from('invitations')
      .select(`
        id,
        token,
        statut,
        date_envoi,
        relances_count,
        invite_id,
        invites ( id, prenom, nom, email ),
        evenements ( id, titre, description, date_debut, date_fin, lieu )
      `)
      .in('id', invitation_ids)

    if (fetchErr) throw fetchErr

    const results = []
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')

    for (const invitation of invitations) {
      const invite = invitation.invites
      const evenement = invitation.evenements

      if (!invite?.email) {
        results.push({ id: invitation.id, status: 'skipped', reason: 'Pas d\'email' })
        continue
      }

      // Vérifier que l'email est normalisé (lowercase, trimé)
      if (invite.email !== invite.email.toLowerCase().trim()) {
        results.push({ id: invitation.id, status: 'skipped', reason: 'Email non normalisé — mettez à jour le contact' })
        continue
      }

      try {
        const rsvpUrl = `${frontendUrl}/rsvp/${invitation.token}`
        await sendInvitation({ invite, evenement, rsvpUrl, isReminder: reminder })

        // Met à jour date_envoi
        const update = reminder
          ? { derniere_relance_at: new Date().toISOString(), relances_count: (invitation.relances_count || 0) + 1 }
          : { date_envoi: new Date().toISOString(), statut: 'envoye' }
        await supabase.from('invitations').update(update).eq('id', invitation.id)

        results.push({ id: invitation.id, status: 'sent', email: invite.email })
      } catch (emailErr) {
        console.error(`Failed to send email for invitation ${invitation.id}:`, emailErr)
        results.push({ id: invitation.id, status: 'failed', error: emailErr.message })
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length
    const failed = results.filter((r) => r.status === 'failed').length
    const skipped = results.filter((r) => r.status === 'skipped').length

    await recordAudit(req, { action: reminder ? 'invitations_reminded' : 'invitations_sent', entityType: 'evenement', metadata: { count: sent, failed, skipped } })

    res.json({ sent, failed, skipped, results })
  } catch (err) {
    next(err)
  }
})

// ─── NOTE: GET /api/invitations/qr/:token is now handled in index.js as a public endpoint
// This protected route is kept for backward compatibility but redirects to the public one.

export default router
