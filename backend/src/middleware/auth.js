import jwt from 'jsonwebtoken'

/**
 * JWT authentication middleware.
 * Reads `Authorization: Bearer <token>`, verifies it, and attaches the
 * decoded payload to `req.user`. Returns 401 if missing or invalid.
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token d\'authentification manquant' })
  }

  const token = authHeader.slice(7) // Strip "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré, veuillez vous reconnecter' })
    }
    return res.status(401).json({ error: 'Token invalide' })
  }
}

export function optionalAuth(req, _res, next) {
  const authHeader = req.headers['authorization']
  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET)
    } catch {
      req.user = null
    }
  }
  next()
}

export function requireAdmin(req, res, next) {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
  }
  next()
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Vous n’avez pas les permissions nécessaires' })
    }
    next()
  }
}
