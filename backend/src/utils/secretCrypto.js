import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const PREFIX = 'enc:v1:'

function getKey() {
  const configured = process.env.TOTP_ENCRYPTION_KEY
  if (!configured) throw new Error('TOTP_ENCRYPTION_KEY est requise pour protéger les secrets 2FA')
  const key = /^[0-9a-f]{64}$/i.test(configured) ? Buffer.from(configured, 'hex') : Buffer.from(configured, 'base64')
  if (key.length !== 32) throw new Error('TOTP_ENCRYPTION_KEY doit contenir 32 octets (64 caractères hexadécimaux)')
  return key
}

export function encryptSecret(value) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`
}

export function decryptSecret(value) {
  if (!value) return value
  if (!value.startsWith(PREFIX)) return value
  const [ivEncoded, tagEncoded, encryptedEncoded] = value.slice(PREFIX.length).split('.')
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivEncoded, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(encryptedEncoded, 'base64url')), decipher.final()]).toString('utf8')
}
