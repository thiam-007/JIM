import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { buildOtpAuthUri, generateRecoveryCodes, generateTotpSecret, verifyTotp } from '../src/utils/totp.js'

test('generates a valid TOTP secret and authenticator URI', () => {
  const secret = generateTotpSecret()
  const uri = buildOtpAuthUri(secret, 'admin@example.com')

  assert.match(secret, /^[A-Z2-7]+$/)
  assert.match(uri, /^otpauth:\/\/totp\//)
  assert.match(uri, new RegExp(`secret=${secret}`))
})

test('verifies a current TOTP code within the allowed clock window', () => {
  const secret = generateTotpSecret()
  const counter = Math.floor(Date.now() / 1000 / 30)
  const key = decodeBase32(secret)
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(BigInt(counter))
  const digest = crypto.createHmac('sha1', key).update(buffer).digest()
  const offset = digest[digest.length - 1] & 0x0f
  const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000
  const code = String(value).padStart(6, '0')

  assert.equal(verifyTotp(secret, code), true)
  assert.equal(verifyTotp(secret, '000000'), false)
})

test('generates unique recovery codes', () => {
  const codes = generateRecoveryCodes(8)
  assert.equal(codes.length, 8)
  assert.equal(new Set(codes).size, 8)
  assert.ok(codes.every(code => /^[A-F0-9]{10}$/.test(code)))
})

function decodeBase32(value) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0
  let buffer = 0
  const result = []
  for (const character of value) {
    buffer = (buffer << 5) | alphabet.indexOf(character)
    bits += 5
    if (bits >= 8) {
      result.push((buffer >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(result)
}
