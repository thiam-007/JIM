import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { v4 as uuidv4 } from 'uuid'
import supabase from '../config/supabase.js'
import { authMiddleware, requireAdmin } from '../middleware/auth.js'
import {
  sendInvitation,
  sendInvitationRequestReceipt,
  sendInvitationRequestRejection
} from '../services/emailService.js'
import { normalizeEmail } from '../utils/emailValidator.js'
import { recordAudit } from '../utils/audit.js'

const router = Router()

const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de demandes depuis cette connexion. Réessayez plus tard.' }
})

function validateOptionalText(value, maxLength, label) {
  if (value !== undefined && value !== null && (typeof value !== 'string' || value.trim().length > maxLength)) {
    return `${label} ne doit pas dépasser ${maxLength} caractères`
  }
  return null
}

router.post('/:eventId', requestLimiter, async (req, res, next) => {
  try {
    const { eventId } = req.params
    const { first_name, last_name, email, organization, job_title, phone, message } = req.body

    if (typeof first_name !== 'string' || !first_name.trim() || typeof last_name !== 'string' || !last_name.trim()) {
      return res.status(400).json({ error: 'Le prénom et le nom sont obligatoires' })
    }
    if (first_name.trim().length > 100 || last_name.trim().length > 100) {
      return res.status(400).json({ error: 'Le prénom et le nom ne doivent pas dépasser 100 caractères' })
    }
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail || normalizedEmail.length > 254) {
      return res.status(400).json({ error: 'Adresse e-mail invalide' })
    }

    for (const [value, maxLength, label] of [
      [organization, 150, 'L’organisation'],
      [job_title, 150, 'La fonction'],
      [phone, 40, 'Le téléphone'],
      [message, 1000, 'Le message']
    ]) {
      const validationError = validateOptionalText(value, maxLength, label)
      if (validationError) return res.status(400).json({ error: validationError })
    }

    const { data: evenement, error: eventError } = await supabase
      .from('evenements')
      .select('id, titre, statut, date_debut, date_fin')
      .eq('id', eventId)
      .eq('statut', 'publie')
      .maybeSingle()
    if (eventError) throw eventError
    if (!evenement) return res.status(404).json({ error: 'Événement indisponible pour les demandes publiques' })
    if (!evenement.date_debut || !evenement.date_fin || Date.parse(evenement.date_fin) < Date.parse(evenement.date_debut)) {
      return res.status(409).json({ error: 'Les dates de cet événement doivent être renseignées avant de demander une invitation.' })
    }

    const { data: existingInvite, error: inviteLookupError } = await supabase
      .from('invites')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()
    if (inviteLookupError) throw inviteLookupError

    if (existingInvite) {
      const { data: existingInvitation, error: invitationLookupError } = await supabase
        .from('invitations')
        .select('id')
        .eq('evenement_id', eventId)
        .eq('invite_id', existingInvite.id)
        .maybeSingle()
      if (invitationLookupError) throw invitationLookupError
      if (existingInvitation) {
        return res.status(409).json({ error: 'Une invitation existe déjà pour cette adresse e-mail et cet événement' })
      }
    }

    const { data: request, error: insertError } = await supabase
      .from('invitation_requests')
      .insert({
        event_id: eventId,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: normalizedEmail,
        organization: organization?.trim() || null,
        job_title: job_title?.trim() || null,
        phone: phone?.trim() || null,
        message: message?.trim() || null
      })
      .select('id')
      .single()

    if (insertError?.code === '23505') {
      return res.status(409).json({ error: 'Une demande pour cette adresse e-mail est déjà en cours pour cet événement' })
    }
    if (insertError) throw insertError

    let receiptSent = true
    try {
      await sendInvitationRequestReceipt({
        request: { first_name: first_name.trim(), email: normalizedEmail },
        evenement
      })
    } catch (emailError) {
      receiptSent = false
      console.error('Échec de l’accusé de réception de la demande d’invitation:', emailError.message)
    }

    res.status(201).json({
      id: request.id,
      status: 'pending',
      receiptSent,
      message: receiptSent
        ? 'Votre demande a été envoyée. Un accusé de réception vous a été adressé.'
        : 'Votre demande a été enregistrée, mais l’accusé de réception n’a pas pu être envoyé.'
    })
  } catch (error) {
    next(error)
  }
})

router.get('/', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const staleProcessingAt = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { error: recoveryError } = await supabase
      .from('invitation_requests')
      .update({ status: 'pending', processing_at: null })
      .eq('status', 'processing')
      .lt('processing_at', staleProcessingAt)
    if (recoveryError) throw recoveryError

    let query = supabase
      .from('invitation_requests')
      .select('*, evenements ( id, titre, date_debut, date_fin )')
      .order('created_at', { ascending: false })

    if (req.query.event_id) query = query.eq('event_id', req.query.event_id)
    if (req.query.status) query = query.eq('status', req.query.status)

    const { data, error } = await query
    if (error) throw error
    res.json(data || [])
  } catch (error) {
    next(error)
  }
})

router.post('/:id/approve', authMiddleware, requireAdmin, async (req, res, next) => {
  let requestId
  try {
    requestId = req.params.id
    const { data: request, error: claimError } = await supabase
      .from('invitation_requests')
      .update({ status: 'processing', processing_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle()

    if (claimError) throw claimError
    if (!request) return res.status(409).json({ error: 'Cette demande a déjà été traitée ou est en cours de traitement' })

    const [{ data: evenement, error: eventError }, { data: existingInvite, error: inviteLookupError }] = await Promise.all([
      supabase.from('evenements').select('*').eq('id', request.event_id).single(),
      supabase.from('invites').select('id, prenom, nom, email, telephone, organisation, titre_poste').eq('email', request.email).maybeSingle()
    ])
    if (eventError) throw eventError
    if (inviteLookupError) throw inviteLookupError
    if (evenement.statut !== 'publie') throw new Error('Cet événement n’est plus ouvert aux demandes publiques')
    if (!evenement.date_debut || !evenement.date_fin || Date.parse(evenement.date_fin) < Date.parse(evenement.date_debut)) {
      throw new Error('Les dates de cet événement doivent être corrigées avant d’approuver cette demande')
    }

    let invite
    if (existingInvite) {
      const { data, error } = await supabase
        .from('invites')
        .update({
          prenom: request.first_name,
          nom: request.last_name,
          telephone: request.phone || existingInvite.telephone,
          organisation: request.organization || existingInvite.organisation,
          titre_poste: request.job_title || existingInvite.titre_poste
        })
        .eq('id', existingInvite.id)
        .select('id, prenom, nom, email, telephone, organisation, titre_poste')
        .single()
      if (error) throw error
      invite = data
    } else {
      const { data, error } = await supabase
        .from('invites')
        .insert({
          prenom: request.first_name,
          nom: request.last_name,
          email: request.email,
          telephone: request.phone,
          organisation: request.organization,
          titre_poste: request.job_title
        })
        .select('id, prenom, nom, email, telephone, organisation, titre_poste')
        .single()
      if (error) throw error
      invite = data
    }

    let invitation
    const { data: existingInvitation, error: invitationLookupError } = await supabase
      .from('invitations')
      .select('id, token, statut, date_envoi')
      .eq('evenement_id', request.event_id)
      .eq('invite_id', invite.id)
      .maybeSingle()
    if (invitationLookupError) throw invitationLookupError

    if (existingInvitation) {
      invitation = existingInvitation
    } else {
      const { data, error } = await supabase
        .from('invitations')
        .insert({ evenement_id: request.event_id, invite_id: invite.id, token: uuidv4().toLowerCase() })
        .select('id, token, statut, date_envoi')
        .single()
      if (error) throw error
      invitation = data
    }

    if (invitation.statut === 'pas_de_reaction' && !invitation.date_envoi) {
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
      await sendInvitation({
        invite,
        evenement,
        rsvpUrl: `${frontendUrl}/rsvp/${invitation.token}`,
        token: invitation.token
      })

      const { error: sendUpdateError } = await supabase
        .from('invitations')
        .update({ statut: 'envoye', date_envoi: new Date().toISOString() })
        .eq('id', invitation.id)
      if (sendUpdateError) throw sendUpdateError
    }

    const { error: requestUpdateError } = await supabase
      .from('invitation_requests')
      .update({ status: 'approved', processing_at: null, reviewed_at: new Date().toISOString(), reviewed_by: req.user.id, invitation_id: invitation.id })
      .eq('id', requestId)
      .eq('status', 'processing')
    if (requestUpdateError) throw requestUpdateError

    await recordAudit(req, {
      action: 'invitation_request_approved',
      entityType: 'invitation_request',
      entityId: requestId,
      metadata: { event_id: request.event_id, invitation_id: invitation.id }
    })

    res.json({ ok: true, status: 'approved', invitation_id: invitation.id })
  } catch (error) {
    if (requestId) {
      await supabase
        .from('invitation_requests')
        .update({ status: 'pending', processing_at: null })
        .eq('id', requestId)
        .eq('status', 'processing')
    }
    next(error)
  }
})

router.post('/:id/reject', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { data: request, error: claimError } = await supabase
      .from('invitation_requests')
      .update({ status: 'processing', processing_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('status', 'pending')
      .select('*, evenements ( id, titre )')
      .maybeSingle()

    if (claimError) throw claimError
    if (!request) return res.status(409).json({ error: 'Cette demande a déjà été traitée ou est en cours de traitement' })

    const { error: rejectError } = await supabase
      .from('invitation_requests')
      .update({ status: 'rejected', processing_at: null, reviewed_at: new Date().toISOString(), reviewed_by: req.user.id })
      .eq('id', req.params.id)
      .eq('status', 'processing')
    if (rejectError) throw rejectError

    let notificationSent = true
    try {
      await sendInvitationRequestRejection({ request, evenement: request.evenements })
    } catch (emailError) {
      notificationSent = false
      console.error('Échec de la notification de refus:', emailError.message)
    }

    await recordAudit(req, {
      action: 'invitation_request_rejected',
      entityType: 'invitation_request',
      entityId: req.params.id,
      metadata: { event_id: request.event_id, notification_sent: notificationSent }
    })

    res.json({ ok: true, status: 'rejected', notificationSent })
  } catch (error) {
    next(error)
  }
})

export default router