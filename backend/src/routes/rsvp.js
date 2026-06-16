import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import supabase from '../config/supabase.js'
import { sendConfirmation } from '../services/emailService.js'
import { generateQrDataUrl } from '../services/qrService.js'

const router = Router()

const rsvpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limite chaque IP à 5 RSVP par minute
  message: { error: 'Trop de requêtes, veuillez patienter une minute.' },
  standardHeaders: true,
  legacyHeaders: false
})

// ─── Get RSVP data by token (PUBLIC) ──────────────────────────────────────────
router.get('/:token', async (req, res, next) => {
  try {
    const { token } = req.params

    const { data, error } = await supabase
      .from('invitations')
      .select(`
        token,
        statut,
        date_reponse,
        notes_rsvp,
        invites ( prenom, nom, email, organisation, titre_poste ),
        evenements ( titre, description, date_debut, date_fin, lieu, image_url )
      `)
      .eq('token', token)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Invitation introuvable ou lien invalide' })

    // Return only safe public data (no internal UUIDs)
    res.json({
      token: data.token,
      statut: data.statut,
      date_reponse: data.date_reponse,
      notes_rsvp: data.notes_rsvp,
      invite: {
        prenom: data.invites.prenom,
        nom: data.invites.nom,
        email: data.invites.email,
        organisation: data.invites.organisation,
        titre_poste: data.invites.titre_poste
      },
      evenement: {
        titre: data.evenements.titre,
        description: data.evenements.description,
        date_debut: data.evenements.date_debut,
        date_fin: data.evenements.date_fin,
        lieu: data.evenements.lieu,
        image_url: data.evenements.image_url
      }
    })
  } catch (err) {
    next(err)
  }
})

// ─── Submit RSVP response (PUBLIC) ────────────────────────────────────────────
router.post('/:token', rsvpLimiter, async (req, res, next) => {
  try {
    const { token } = req.params
    const { confirmed, notes } = req.body

    if (typeof confirmed !== 'boolean') {
      return res.status(400).json({ error: 'Le champ "confirmed" (boolean) est requis' })
    }

    // Fetch current invitation
    const { data: invitation, error: fetchErr } = await supabase
      .from('invitations')
      .select(`
        id,
        token,
        statut,
        invites ( prenom, nom, email, organisation, titre_poste ),
        evenements ( id, titre, description, date_debut, date_fin, lieu, image_url )
      `)
      .eq('token', token)
      .single()

    if (fetchErr || !invitation) {
      return res.status(404).json({ error: 'Invitation introuvable ou lien invalide' })
    }

    const newStatut = confirmed ? 'inscrit' : 'decline'
    const now = new Date().toISOString()

    // Update invitation
    const { data: updated, error: updateErr } = await supabase
      .from('invitations')
      .update({
        statut: newStatut,
        date_reponse: now,
        notes_rsvp: notes || null
      })
      .eq('id', invitation.id)
      .select('statut, date_reponse')
      .single()

    if (updateErr) throw updateErr

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    let qr_url = null

    // If confirmed, send confirmation email with QR code
    if (confirmed && invitation.invites?.email) {
      qr_url = `${process.env.BACKEND_URL || ''}/api/invitations/qr/${token}`

      try {
        const qrCodeBase64 = await generateQrDataUrl(token, frontendUrl)
        await sendConfirmation({
          invite: invitation.invites,
          evenement: invitation.evenements,
          qrCodeBase64,
          token
        })
      } catch (emailErr) {
        // Don't fail the whole request if email fails — just log it
        console.error('Failed to send confirmation email:', emailErr)
      }
    }

    res.json({
      statut: updated.statut,
      date_reponse: updated.date_reponse,
      ...(confirmed && { qr_url: `/api/invitations/qr/${token}` })
    })
  } catch (err) {
    next(err)
  }
})

export default router
