import test from 'node:test'
import assert from 'node:assert/strict'
import { decryptSecret, encryptSecret } from '../src/utils/secretCrypto.js'

process.env.TOTP_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

test('encrypts and decrypts TOTP secrets', () => {
  const secret = 'JBSWY3DPEHPK3PXP'
  const encrypted = encryptSecret(secret)

  assert.notEqual(encrypted, secret)
  assert.match(encrypted, /^enc:v1:/)
  assert.equal(decryptSecret(encrypted), secret)
})

test('keeps legacy plaintext secrets readable during migration', () => {
  assert.equal(decryptSecret('JBSWY3DPEHPK3PXP'), 'JBSWY3DPEHPK3PXP')
})
