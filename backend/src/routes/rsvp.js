import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import crypto from 'crypto'
import supabase from '../config/supabase.js'
import { sendConfirmation } from '../services/emailService.js'
import { generateQrDataUrl } from '../services/qrService.js'
import { normalizeEmail } from '../utils/emailValidator.js'

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
    if (notes !== undefined && notes !== null && (typeof notes !== 'string' || notes.length > 2000)) {
      return res.status(400).json({ error: 'Les notes doivent contenir au maximum 2000 caractères' })
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
      .neq('statut', 'present')
      .select('statut, date_reponse')
      .maybeSingle()

    if (updateErr) throw updateErr
    if (!updated) return res.status(409).json({ error: 'Cette invitation est déjà enregistrée comme présente' })

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

// ─── GET /api/rsvp/evenement/:id — Public event details for self-registration ─────────────
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

// ─── POST /api/rsvp/evenement/:id/register — Public self-registration ────────────────────────────
router.post('/evenement/:id/register', rsvpLimiter, async (req, res, next) => {
  try {
    const evenement_id = req.params.id
    const { prenom, nom, email, organisation, telephone } = req.body

    if (!prenom || !nom) return res.status(400).json({ error: 'Prénom et nom requis' })
    if (typeof prenom !== 'string' || typeof nom !== 'string' || prenom.trim().length > 100 || nom.trim().length > 100) {
      return res.status(400).json({ error: 'Le prénom et le nom doivent contenir au maximum 100 caractères' })
    }
    if (!email) return res.status(400).json({ error: 'L\'adresse e-mail est obligatoire pour s\'inscrire.' })
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail) return res.status(400).json({ error: 'Adresse e-mail invalide' })
    if (organisation !== undefined && organisation !== null && (typeof organisation !== 'string' || organisation.trim().length > 150)) {
      return res.status(400).json({ error: 'L\'organisation doit contenir au maximum 150 caractères' })
    }
    if (telephone !== undefined && telephone !== null && (typeof telephone !== 'string' || telephone.trim().length > 40)) {
      return res.status(400).json({ error: 'Le téléphone doit contenir au maximum 40 caractères' })
    }

    // Vérifier si l'événement est actif et publié
    const { data: evenement, error: evErr } = await supabase
      .from('evenements')
      .select('id, titre, description, date_debut, date_fin, lieu, image_url, statut')
      .eq('id', evenement_id)
      .single()

    if (evErr || !evenement) return res.status(404).json({ error: 'Événement introuvable' })
    if (evenement.statut !== 'publie') {
      return res.status(403).json({ error: 'Cet événement n\'est pas ouvert aux inscriptions publiques.' })
    }

    let inviteId = null
    let inviteData = null

    // 1. Recherche par e-mail
    const { data: existingInvite } = await supabase
      .from('invites')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingInvite) {
      inviteId = existingInvite.id
      inviteData = existingInvite
    } else {
      // Créer le contact
      const { data: newInvite, error: inviteErr } = await supabase
        .from('invites')
        .insert({
          prenom: prenom.trim(),
          nom: nom.trim(),
          organisation: organisation ? organisation.trim() : null,
          email: normalizedEmail,
          telephone: telephone ? telephone.trim() : null
        })
        .select()
        .single()

      if (inviteErr) throw inviteErr
      inviteId = newInvite.id
      inviteData = newInvite
    }

    // 2. Créer ou récupérer l'invitation pour cet événement
    let invitation = null
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id, token, statut')
      .eq('evenement_id', evenement_id)
      .eq('invite_id', inviteId)
      .maybeSingle()

    if (existingInvitation) {
      invitation = existingInvitation
      // Si l'invitation existe déjà mais n'est pas confirmée, on la valide
      if (invitation.statut !== 'present' && invitation.statut !== 'inscrit') {
        const { data: updated, error: updateErr } = await supabase
          .from('invitations')
          .update({
            statut: 'inscrit',
            date_reponse: new Date().toISOString()
          })
          .eq('id', invitation.id)
          .select('id, token, statut')
          .single()

        if (updateErr) throw updateErr
        invitation = updated
      }
    } else {
      const token = crypto.randomUUID()
      const { data: newInvitation, error: inviteErr } = await supabase
        .from('invitations')
        .insert({
          evenement_id,
          invite_id: inviteId,
          token,
          statut: 'inscrit',
          date_reponse: new Date().toISOString()
        })
        .select('id, token, statut')
        .single()

      if (inviteErr) throw inviteErr
      invitation = newInvitation
    }

    // 3. Envoyer un e-mail de confirmation avec le QR code si l'e-mail est disponible
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
    const qrCodeDataUrl = await generateQrDataUrl(invitation.token, frontendUrl)

    try {
      await sendConfirmation({
        invite: inviteData,
        evenement: evenement,
        qrCodeDataUrl,
        token: invitation.token
      })
    } catch (emailErr) {
      console.error('Failed to send self-registration confirmation email:', emailErr)
    }

    res.status(201).json({
      ok: true,
      token: invitation.token,
      statut: invitation.statut
    })
  } catch (err) {
    next(err)
  }
})

export default router
