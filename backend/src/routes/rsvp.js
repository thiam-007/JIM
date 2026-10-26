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

async function promoteNextWaiting(evenementId) {
  const { data: waiting, error } = await supabase
    .from('invitations')
    .select('id, token, invites ( prenom, nom, email, organisation, titre_poste ), evenements ( id, titre, description, date_debut, date_fin, lieu )')
    .eq('evenement_id', evenementId)
    .eq('statut', 'liste_attente')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error || !waiting) return

  const { data: promoted, error: updateError } = await supabase
    .from('invitations')
    .update({ statut: 'inscrit', date_reponse: new Date().toISOString() })
    .eq('id', waiting.id)
    .eq('statut', 'liste_attente')
    .select('id, token, statut')
    .maybeSingle()
  if (updateError || !promoted) return

  if (waiting.invites?.email) {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
    try {
      const qrCodeDataUrl = await generateQrDataUrl(waiting.token, frontendUrl)
      await sendConfirmation({ invite: waiting.invites, evenement: waiting.evenements, qrCodeDataUrl, token: waiting.token })
    } catch (emailError) {
      console.error('Échec de notification de la liste d’attente:', emailError.message)
    }
  }
}

// ─── Get RSVP data by token (PUBLIC) ──────────────────────────────────────────
router.get('/:token', async (req, res, next) => {
  try {
    let token = (req.params.token || '').trim().toLowerCase()
    if (token.endsWith('.png')) {
      token = token.slice(0, -4)
    }

    const { data, error } = await supabase
      .from('invitations')
      .select(`
        token,
        expires_at,
        revoked_at,
        statut,
        date_reponse,
        notes_rsvp,
        invites ( prenom, nom, email, organisation, titre_poste ),
        evenements ( titre, description, date_debut, date_fin, lieu, image_url )
      `)
      .eq('token', token)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Invitation introuvable ou lien invalide' })
    if (data.revoked_at || (data.expires_at && new Date(data.expires_at) <= new Date())) {
      return res.status(410).json({ error: 'Cette invitation a expiré ou a été révoquée' })
    }

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
    let token = (req.params.token || '').trim().toLowerCase()
    if (token.endsWith('.png')) {
      token = token.slice(0, -4)
    }
    const { confirmed, notes } = req.body

    if (typeof confirmed !== 'boolean') {
      return res.status(400).json({ error: 'Le champ "confirmed" (boolean) est requis' })
    }
    if (notes !== undefined && notes !== null && (typeof notes !== 'string' || notes.length > 2000)) {
      return res.status(400).json({ error: 'Les notes doivent contenir au maximum 2000 caractères' })
    }

    // Fetch current invitation
    const { data: invitation, error: fetchErr } = await supabase
      .from('invitations')
      .select(`
        id,
        token,
        expires_at,
        revoked_at,
        statut,
        invites ( prenom, nom, email, organisation, titre_poste ),
        evenements ( id, titre, description, date_debut, date_fin, lieu, image_url )
      `)
      .eq('token', token)
      .single()

    if (fetchErr || !invitation) {
      return res.status(404).json({ error: 'Invitation introuvable ou lien invalide' })
    }
    if (invitation.revoked_at || (invitation.expires_at && new Date(invitation.expires_at) <= new Date())) {
      return res.status(410).json({ error: 'Cette invitation a expiré ou a été révoquée' })
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
      .neq('statut', 'present')
      .select('statut, date_reponse')
      .maybeSingle()

    if (updateErr) throw updateErr
    if (!updated) return res.status(409).json({ error: 'Cette invitation est déjà enregistrée comme présente' })
    if (!confirmed) await promoteNextWaiting(invitation.evenements.id)

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
    let qr_url = null

    // If confirmed, send confirmation email with QR code
    if (confirmed && invitation.invites?.email) {
      const qrCodeDataUrl = await generateQrDataUrl(token, frontendUrl)

      try {
        await sendConfirmation({
          invite: invitation.invites,
          evenement: invitation.evenements,
          qrCodeDataUrl,
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
      ...(confirmed && { qr_url: `/api/invitations/qr/${token}.png` })
    })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/rsvp/evenement/:id — Public event details for invitation requests ───────────
router.get('/evenement/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('evenements')
      .select('id, titre, description, date_debut, date_fin, lieu, image_url, format, statut')
      .eq('id', req.params.id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Événement introuvable' })
    if (data.statut !== 'publie') {
      return res.status(403).json({ error: 'Cet événement n\'est pas ouvert aux inscriptions publiques.' })
    }
    
    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/evenement/:id/register', rsvpLimiter, (req, res) => {
  res.status(410).json({ error: 'L’inscription publique est désactivée. Vous pouvez demander une invitation.' })
})

export default router
