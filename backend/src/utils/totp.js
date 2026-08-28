import crypto from 'crypto'

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function generateTotpSecret(bytes = 20) {
  return encodeBase32(crypto.randomBytes(bytes))
}

export function buildOtpAuthUri(secret, email, issuer = "MVG Event's") {
  return `otpauth://totp/${encodeURIComponent(`${issuer}:${email}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}

export function verifyTotp(secret, code, window = 1) {
  if (!secret || !/^\d{6}$/.test(String(code))) return false
  const counter = Math.floor(Date.now() / 1000 / 30)
  return Array.from({ length: window * 2 + 1 }, (_, index) => counter + index - window)
    .some(candidate => generateTotp(secret, candidate) === String(code))
}

export function generateRecoveryCodes(count = 8) {
  return Array.from({ length: count }, () => crypto.randomBytes(5).toString('hex').toUpperCase())
}

function generateTotp(secret, counter) {
  const key = decodeBase32(secret)
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(BigInt(counter))
  const digest = crypto.createHmac('sha1', key).update(buffer).digest()
  const offset = digest[digest.length - 1] & 0x0f
  const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000
  return String(value).padStart(6, '0')
}

function encodeBase32(buffer) {
  let bits = 0
  let value = 0
  let result = ''
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      result += BASE32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) result += BASE32[(value << (5 - bits)) & 31]
  return result
}

function decodeBase32(value) {
  let bits = 0
  let buffer = 0
  const result = []
  for (const character of value.replace(/=+$/, '').toUpperCase()) {
    const index = BASE32.indexOf(character)
    if (index < 0) throw new Error('Secret TOTP invalide')
    buffer = (buffer << 5) | index
    bits += 5
    if (bits >= 8) {
      result.push((buffer >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(result)
}
