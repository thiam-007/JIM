import supabase from '../config/supabase.js'
import { sendInvitation } from './emailService.js'

const DEFAULT_AFTER_DAYS = 3
const DEFAULT_REPEAT_DAYS = 7

export async function sendAutomaticReminders() {
  const afterDays = Number(process.env.REMINDER_AFTER_DAYS) || DEFAULT_AFTER_DAYS
  const repeatDays = Number(process.env.REMINDER_REPEAT_DAYS) || DEFAULT_REPEAT_DAYS
  const now = Date.now()
  const firstReminderBefore = new Date(now - afterDays * 24 * 60 * 60 * 1000).toISOString()
  const repeatReminderBefore = new Date(now - repeatDays * 24 * 60 * 60 * 1000).toISOString()

  const { data: invitations, error } = await supabase
    .from('invitations')
    .select(`
      id, token, statut, date_envoi, date_reponse, derniere_relance_at, relances_count,
      invites ( id, prenom, nom, email, organisation, titre_poste ),
      evenements ( id, titre, description, date_debut, date_fin, lieu, email_sujet, email_intro, email_signature )
    `)
    .eq('statut', 'envoye')
    .is('date_reponse', null)
    .not('date_envoi', 'is', null)
    .lte('date_envoi', firstReminderBefore)
    .or(`derniere_relance_at.is.null,derniere_relance_at.lte.${repeatReminderBefore}`)
    .limit(100)

  if (error) throw error

  const results = []
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')

  for (const invitation of invitations || []) {
    if (!invitation.invites?.email || !invitation.evenements) {
      results.push({ id: invitation.id, status: 'skipped', reason: 'Email ou événement manquant' })
      continue
    }

    try {
      await sendInvitation({
        invite: invitation.invites,
        evenement: invitation.evenements,
        rsvpUrl: `${frontendUrl}/rsvp/${invitation.token}`,
        isReminder: true
      })

      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          derniere_relance_at: new Date().toISOString(),
          relances_count: (invitation.relances_count || 0) + 1
        })
        .eq('id', invitation.id)
        .is('date_reponse', null)

      if (updateError) throw updateError
      results.push({ id: invitation.id, status: 'sent', email: invitation.invites.email })
    } catch (sendError) {
      console.error(`Échec de relance pour ${invitation.id}:`, sendError)
      results.push({ id: invitation.id, status: 'failed', error: sendError.message })
    }
  }

  return {
    processed: results.length,
    sent: results.filter(result => result.status === 'sent').length,
    failed: results.filter(result => result.status === 'failed').length,
    skipped: results.filter(result => result.status === 'skipped').length
  }
}
