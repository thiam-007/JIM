import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

/**
 * POST /api/auth/login
 * Body: { password: string }
 * Returns: { token: string }
 */
router.post('/login', (req, res, next) => {
  try {
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ error: 'Mot de passe requis' })
    }

    if (password !== process.env.APP_PASSWORD) {
      return res.status(401).json({ error: 'Mot de passe incorrect' })
    }

    const token = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    )

    res.json({ token })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/auth/me
 * Protected — requires valid JWT
 * Returns: { ok: true, role: string }
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({ ok: true, role: req.user.role })
})

export default router
