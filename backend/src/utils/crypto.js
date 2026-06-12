import crypto from 'crypto'

/**
 * Hash a password using Node's PBKDF2 pbkdf2Sync.
 * Returns salt:hash format.
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verify a password against a stored salt:hash string.
 */
export function verifyPassword(password, storedValue) {
  if (!storedValue || !storedValue.includes(':')) return false
  const [salt, originalHash] = storedValue.split(':')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return hash === originalHash
}
