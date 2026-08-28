import supabase from '../config/supabase.js'

export async function recordAudit(req, { action, entityType, entityId = null, metadata = {} }) {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      actor_id: req.user?.id || null,
      actor_email: req.user?.email || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata
    })
    if (error) console.error('Journal audit indisponible:', error.message)
  } catch (error) {
    console.error('Journal audit indisponible:', error.message)
  }
}
