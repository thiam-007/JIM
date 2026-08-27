/**
 * Email validation and normalization utilities (Frontend)
 * Mirrors backend validation for consistency
 */

/**
 * Normalize email: trim, lowercase, basic validation
 * @param {string} email - Raw email input
 * @returns {string|null} Normalized email or null if invalid
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null

  const normalized = email.trim().toLowerCase()

  // Basic format check
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!EMAIL_REGEX.test(normalized)) return null

  // Check for restricted domains (for testing/dev)
  const RESTRICTED_DOMAINS = ['localhost', 'test.com', 'example.com', 'test.gn']
  const domain = normalized.split('@')[1]
  if (RESTRICTED_DOMAINS.includes(domain)) return null

  return normalized
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidEmail(email) {
  return normalizeEmail(email) !== null
}

/**
 * Check if email matches professional domain patterns
 * @param {string} email - Email to check
 * @returns {boolean} True if professional domain
 */
export function isProfessionalEmail(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return false

  const domain = normalized.split('@')[1]
  return /\.(fr|gov|gn|org|com|edu|net)$/.test(domain)
}
