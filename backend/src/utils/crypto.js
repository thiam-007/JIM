import crypto from 'crypto'

const CURRENT_ITERATIONS = 310000

/**
 * Hash a password using Node's PBKDF2 pbkdf2Sync.
 * Returns salt:iterations:hash format.
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, CURRENT_ITERATIONS, 64, 'sha512').toString('hex')
  return `${salt}:${CURRENT_ITERATIONS}:${hash}`
}

/**
 * Verify a password against a stored string.
 * Supports both legacy (salt:hash) and new (salt:iterations:hash) formats.
 * @returns {{isValid: boolean, needsUpgrade: boolean}}
 */
export function verifyPassword(password, storedValue) {
  if (!storedValue || !storedValue.includes(':')) return { isValid: false, needsUpgrade: false }
  
  const parts = storedValue.split(':')
  let salt, iterations, originalHash
  
  // Legacy format: salt:hash (implied 1000 iterations)
  if (parts.length === 2) {
    salt = parts[0]
    iterations = 1000
    originalHash = parts[1]
  } 
  // New format: salt:iterations:hash
  else if (parts.length === 3) {
    salt = parts[0]
    iterations = parseInt(parts[1], 10)
    originalHash = parts[2]
  } else {
    return { isValid: false, needsUpgrade: false }
  }
  
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex')
  const isValid = hash === originalHash
  const needsUpgrade = isValid && iterations < CURRENT_ITERATIONS
  
  return { isValid, needsUpgrade }
}
