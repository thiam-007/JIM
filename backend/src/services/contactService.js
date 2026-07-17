import supabase from '../config/supabase.js'
import { sendContactMessage, sendContactReceipt } from './emailService.js'

function normalizeContactPayload(payload = {}) {
  const prenom = String(payload?.prenom || '').trim().substring(0, 100)
  const nom = String(payload?.nom || '').trim().substring(0, 100)
  const email = String(payload?.email || '').trim().substring(0, 255)
  const sujet = String(payload?.sujet || '').trim().substring(0, 200)
  const message = String(payload?.message || '').trim().substring(0, 5000)

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
    // Send to admin
    await sendMail({
      ...normalized,
      recipient
    })
    // Send auto-reply to user
    await sendContactReceipt(normalized)
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
