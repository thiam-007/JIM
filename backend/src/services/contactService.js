import supabase from '../config/supabase.js'
import { sendContactMessage } from './emailService.js'

function normalizeContactPayload(payload = {}) {
  const prenom = String(payload?.prenom || '').trim()
  const nom = String(payload?.nom || '').trim()
  const email = String(payload?.email || '').trim()
  const sujet = String(payload?.sujet || '').trim()
  const message = String(payload?.message || '').trim()

  if (!prenom || !nom || !email || !sujet || !message) {
    throw new Error('Tous les champs sont requis')
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) {
    throw new Error('Adresse e-mail invalide')
  }

  return { prenom, nom, email, sujet, message }
}

async function defaultSaveMessage(payload) {
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([
        {
          prenom: payload.prenom,
          nom: payload.nom,
          email: payload.email,
          sujet: payload.sujet,
          message: payload.message,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.warn('[contact] impossible d’enregistrer le message:', err.message)
    return null
  }
}

export async function submitContactMessage(payload, deps = {}) {
  const normalized = normalizeContactPayload(payload)
  const saveMessage = deps.saveMessage || defaultSaveMessage
  const sendMail = deps.sendMail || sendContactMessage

  const saved = await saveMessage(normalized)

  const recipient = deps.recipient || process.env.CONTACT_EMAIL || process.env.APP_EMAIL || 'musee@expertisefrance.fr'

  let emailSent = false
  try {
    await sendMail({
      ...normalized,
      recipient
    })
    emailSent = true
  } catch (err) {
    console.warn('[contact] échec d’envoi d’e-mail:', err.message)
  }

  return {
    success: true,
    saved,
    emailSent,
    recipient
  }
}
