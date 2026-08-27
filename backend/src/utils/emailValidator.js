/**
 * Email validation & normalization utilities for the invitation system
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESTRICTED_DOMAINS = ['localhost', 'test.com', 'example.com', 'test.gn']

/**
 * Normalize email: trim, lowercase, basic validation
 * @param {string} email - Raw email input
 * @returns {string|null} Normalized email or null if invalid
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null

  const normalized = email.trim().toLowerCase()

  // Basic format check
  if (!EMAIL_REGEX.test(normalized)) return null

  // Check for restricted domains (for testing/dev)
  const domain = normalized.split('@')[1]
  if (RESTRICTED_DOMAINS.includes(domain)) return null

  return normalized
}

/**
 * Validate email with optional domain whitelist
 * @param {string} email - Email to validate
 * @param {string[]} allowedDomains - Optional domain whitelist (e.g. ['fr', 'gov', 'gn'])
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidEmail(email, allowedDomains = null) {
  const normalized = normalizeEmail(email)
  if (!normalized) return false

  // If domains are specified, check if email domain matches
  if (allowedDomains && allowedDomains.length > 0) {
    const domain = normalized.split('@')[1]
    return allowedDomains.some(allowed => domain.endsWith(allowed))
  }

  return true
}

/**
 * Extract email domain
 * @param {string} email - Email address
 * @returns {string|null} Domain or null
 */
export function getEmailDomain(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return null
  return normalized.split('@')[1]
}

/**
 * Check if email matches professional domain patterns (TLDs: .fr, .gov, .gn, .org)
 * @param {string} email - Email to check
 * @returns {boolean} True if professional domain
 */
export function isProfessionalEmail(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return false

  const domain = normalized.split('@')[1]
  return /\.(fr|gov|gn|org|com|edu|net)$/.test(domain)
}
