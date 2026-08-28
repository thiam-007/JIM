import { Router } from 'express'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import supabase from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { hashPassword, verifyPassword } from '../utils/crypto.js'
import { recordAudit } from '../utils/audit.js'
import QRCode from 'qrcode'
import { buildOtpAuthUri, generateRecoveryCodes, generateTotpSecret, verifyTotp } from '../utils/totp.js'
import { decryptSecret, encryptSecret } from '../utils/secretCrypto.js'

const router = Router()

function signUserToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, prenom: user.prenom, nom: user.nom },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  )
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limite chaque IP à 10 requêtes de login par fenêtre
  message: { error: 'Trop de tentatives de connexion, veuillez patienter 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, role, email }
 */
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' })
    }

    const cleanEmail = email.toLowerCase().trim()

    // Lookup user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .single()

    if (error || !user) {
      // Auto-seeding: If it's the first login using the legacy APP_PASSWORD from env
      if (cleanEmail === 'musee@expertisefrance.fr' && password === process.env.APP_PASSWORD) {
        const hashed = hashPassword(password)
        const { data: newUser, error: createErr } = await supabase
          .from('users')
          .insert({
            email: 'musee@expertisefrance.fr',
            password_hash: hashed,
            role: 'super_admin'
          })
          .select()
          .single()

        if (!createErr && newUser) {
          const token = signUserToken(newUser)
          return res.json({ token, role: newUser.role, email: newUser.email, prenom: newUser.prenom, nom: newUser.nom })
        }
      }
      return res.status(401).json({ error: 'Identifiants incorrects' })
    }

    // Verify hashed password
    const { isValid, needsUpgrade } = verifyPassword(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ error: 'Identifiants incorrects' })
    }

    // Auto-upgrade password hash if using old format/low iterations
    if (needsUpgrade) {
      const newHash = hashPassword(password)
      // Fire and forget (don't block login if it fails)
      supabase.from('users').update({ password_hash: newHash }).eq('id', user.id).then()
    }

    if (user.role === 'super_admin' && user.totp_enabled) {
      const challengeToken = jwt.sign({ id: user.id, purpose: '2fa' }, process.env.JWT_SECRET, { expiresIn: '5m' })
      return res.status(401).json({ error: 'Code 2FA requis', twoFactorRequired: true, challengeToken })
    }

    const token = signUserToken(user)

    res.json({ token, role: user.role, email: user.email, prenom: user.prenom, nom: user.nom })
  } catch (err) {
    next(err)
  }
})

router.post('/2fa/verify', async (req, res, next) => {
  try {
    const { challengeToken, code } = req.body
    const challenge = jwt.verify(challengeToken, process.env.JWT_SECRET)
    if (challenge.purpose !== '2fa') return res.status(401).json({ error: 'Challenge 2FA invalide' })

    const { data: user, error } = await supabase.from('users').select('*').eq('id', challenge.id).single()
    if (error || !user || user.role !== 'super_admin' || !user.totp_enabled) return res.status(401).json({ error: 'Challenge 2FA invalide' })

    let valid = verifyTotp(decryptSecret(user.totp_secret), code)
    let recoveryCodes = user.recovery_codes || []
    if (!valid) {
      const normalizedCode = String(code || '').trim().toUpperCase()
      const index = recoveryCodes.indexOf(normalizedCode)
      valid = index !== -1
      if (valid) {
        recoveryCodes = recoveryCodes.filter((_, codeIndex) => codeIndex !== index)
        await supabase.from('users').update({ recovery_codes: recoveryCodes }).eq('id', user.id)
      }
    }
    if (!valid) return res.status(401).json({ error: 'Code 2FA incorrect' })

    await recordAudit(req, { action: '2fa_verified', entityType: 'user', entityId: user.id })
    res.json({ token: signUserToken(user), role: user.role, email: user.email, prenom: user.prenom, nom: user.nom })
  } catch (err) {
    return res.status(401).json({ error: 'Challenge 2FA expiré ou invalide' })
  }
})

router.post('/2fa/setup', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'La 2FA est réservée au Super Administrateur' })
    const secret = generateTotpSecret()
    const recoveryCodes = generateRecoveryCodes()
    const { error } = await supabase.from('users').update({ totp_secret: encryptSecret(secret), totp_enabled: false, recovery_codes: recoveryCodes }).eq('id', req.user.id)
    if (error) throw error
    const qrCode = await QRCode.toDataURL(buildOtpAuthUri(secret, req.user.email))
    res.json({ secret, qrCode, recoveryCodes })
  } catch (err) {
    next(err)
  }
})

router.post('/2fa/enable', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'La 2FA est réservée au Super Administrateur' })
    const { data: user, error: fetchError } = await supabase.from('users').select('totp_secret').eq('id', req.user.id).single()
    if (fetchError || !user?.totp_secret || !verifyTotp(decryptSecret(user.totp_secret), req.body.code)) return res.status(400).json({ error: 'Code 2FA incorrect' })
    const { error } = await supabase.from('users').update({ totp_enabled: true }).eq('id', req.user.id)
    if (error) throw error
    await recordAudit(req, { action: '2fa_enabled', entityType: 'user', entityId: req.user.id })
    res.json({ enabled: true })
  } catch (err) {
    next(err)
  }
})

router.post('/2fa/disable', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'La 2FA est réservée au Super Administrateur' })
    const { data: user, error: fetchError } = await supabase.from('users').select('totp_secret').eq('id', req.user.id).single()
    if (fetchError || !user?.totp_secret || !verifyTotp(decryptSecret(user.totp_secret), req.body.code)) return res.status(400).json({ error: 'Code 2FA incorrect' })
    const { error } = await supabase.from('users').update({ totp_secret: null, totp_enabled: false, recovery_codes: [] }).eq('id', req.user.id)
    if (error) throw error
    await recordAudit(req, { action: '2fa_disabled', entityType: 'user', entityId: req.user.id })
    res.json({ enabled: false })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/auth/me
 * Protected — requires valid JWT
 */
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const { data: user } = await supabase.from('users').select('totp_enabled').eq('id', req.user.id).single()
    res.json({ ok: true, id: req.user.id, email: req.user.email, role: req.user.role, prenom: req.user.prenom, nom: req.user.nom, totp_enabled: req.user.role === 'super_admin' && !!user?.totp_enabled })
  } catch (err) {
    next(err)
  }
})

/**
 * PUT /api/auth/password
 * Protected — requires valid JWT
 */
router.put('/password', authMiddleware, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 6 caractères' })
    }

    // Verify current password
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single()

    if (error || !user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    const { isValid } = verifyPassword(currentPassword, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' })
    }

    // Update password
    const hashed = hashPassword(newPassword)
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashed })
      .eq('id', req.user.id)

    if (updateError) throw updateError

    res.json({ success: true, message: 'Mot de passe mis à jour avec succès' })
  } catch (err) {
    next(err)
  }
})

// ─── ADMIN MANAGEMENT (SUPER ADMIN ONLY) ──────────────────────────────────────

// Check if user is super admin
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Accès réservé au Super Administrateur' })
  }
  next()
}

/**
 * GET /api/auth/users
 * Protected (Super Admin)
 */
router.get('/users', authMiddleware, requireSuperAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, prenom, nom, created_at')
      .order('email', { ascending: true })

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/audit — recent security and operational actions
router.get('/audit', authMiddleware, requireSuperAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500)
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, actor_id, actor_email, action, entity_type, entity_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      if (['42P01', '42501', 'PGRST205'].includes(error.code)) {
        return res.status(503).json({ error: 'Le journal audit n’est pas encore disponible. Vérifiez la création de la table audit_logs dans Supabase.' })
      }
      throw error
    }
    res.json(data || [])
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/auth/users
 * Protected (Super Admin)
 */
router.post('/users', authMiddleware, requireSuperAdmin, async (req, res, next) => {
  try {
    const { email, password, role, prenom, nom } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' })
    }

    const validRoles = ['super_admin', 'admin', 'accueil', 'lecteur']
    const finalRole = validRoles.includes(role) ? role : 'admin'

    const hashed = hashPassword(password)

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: hashed,
        role: finalRole,
        prenom: prenom?.trim() || null,
        nom: nom?.trim() || null
      })
      .select('id, email, role, prenom, nom, created_at')
      .single()

    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' })
      }
      throw error
    }

    await recordAudit(req, { action: 'user_created', entityType: 'user', entityId: data.id, metadata: { role: data.role } })
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

/**
 * DELETE /api/auth/users/:id
 * Protected (Super Admin)
 */
router.delete('/users/:id', authMiddleware, requireSuperAdmin, async (req, res, next) => {
  try {
    const { id } = req.params

    if (req.user.id === id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' })
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error
    await recordAudit(req, { action: 'user_deleted', entityType: 'user', entityId: id })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
