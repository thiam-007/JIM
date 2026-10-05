import { Router } from 'express'
import supabase from '../config/supabase.js'
import { authMiddleware, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('metadata, created_at')
      .eq('action', 'app_update_approved')
      .eq('entity_type', 'app_update')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    res.set('Cache-Control', 'no-store')
    res.json({
      buildHash: data?.metadata?.buildHash || null,
      approvedAt: data?.created_at || null
    })
  } catch (error) {
    next(error)
  }
})

router.post('/approve', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { buildHash } = req.body
    if (typeof buildHash !== 'string' || !/^[a-f0-9]{64}$/.test(buildHash)) {
      return res.status(400).json({ error: 'Empreinte de mise à jour invalide' })
    }

    const { error } = await supabase.from('audit_logs').insert({
      actor_id: req.user.id,
      actor_email: req.user.email,
      action: 'app_update_approved',
      entity_type: 'app_update',
      metadata: { buildHash }
    })
    if (error) throw error

    res.json({ ok: true, buildHash })
  } catch (error) {
    next(error)
  }
})

export default router