import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import supabase from '../config/supabase.js'
import { sendInvitation } from '../services/emailService.js'
import { generateQrPng } from '../services/qrService.js'

const router = Router()

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
        heure_arrivee,
        notes_rsvp,
        created_at,
        invite_id,
        invites ( id, prenom, nom, email, organisation, titre_poste ),
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
    const records = invite_ids.map((invite_id) => ({
      evenement_id,
      invite_id,
      token: uuidv4()
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

// ─── Delete invitation ─────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
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
    const { invitation_ids } = req.body

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

      try {
        const rsvpUrl = `${frontendUrl}/rsvp/${invitation.token}`
        await sendInvitation({ invite, evenement, rsvpUrl })

        // Update date_envoi and statut if still 'pas_de_reaction'
        const updates = { date_envoi: new Date().toISOString() }
        if (invitation.statut === 'pas_de_reaction') {
          updates.statut = 'pas_de_reaction' // Keep statut but record send date
        }

        await supabase
          .from('invitations')
          .update({ date_envoi: new Date().toISOString() })
          .eq('id', invitation.id)

        results.push({ id: invitation.id, status: 'sent', email: invite.email })
      } catch (emailErr) {
        console.error(`Failed to send email for invitation ${invitation.id}:`, emailErr)
        results.push({ id: invitation.id, status: 'failed', error: emailErr.message })
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length
    const failed = results.filter((r) => r.status === 'failed').length
    const skipped = results.filter((r) => r.status === 'skipped').length

    res.json({ sent, failed, skipped, results })
  } catch (err) {
    next(err)
  }
})

// ─── Get QR code as PNG image ──────────────────────────────────────────────────
router.get('/qr/:token', async (req, res, next) => {
  try {
    let { token } = req.params
    if (token.endsWith('.png')) {
      token = token.slice(0, -4)
    }

    // Verify token exists
    const { data, error } = await supabase
      .from('invitations')
      .select('id, token')
      .eq('token', token)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Invitation introuvable' })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const pngBuffer = await generateQrPng(token, frontendUrl)

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Cache-Control', 'public, max-age=86400') // Cache 1 day
    res.send(pngBuffer)
  } catch (err) {
    next(err)
  }
})

export default router
