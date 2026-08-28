import test from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'

const { submitContactMessage } = await import('../src/services/contactService.js')

test('submitContactMessage validates required fields', async () => {
  await assert.rejects(
    () => submitContactMessage({ prenom: 'Ada' }, { saveMessage: async () => null, sendMail: async () => true }),
    /Tous les champs sont requis/
  )
})

test('submitContactMessage persists and notifies when deps succeed', async () => {
  let saved = null
  const result = await submitContactMessage(
    {
      prenom: 'Ada',
      nom: 'Lovelace',
      email: 'ada@example.com',
      sujet: 'Demande de partenariat',
      message: 'Bonjour depuis les tests'
    },
    {
      saveMessage: async (payload) => {
        saved = payload
        return { id: '1' }
      },
      sendMail: async () => true,
      sendReceipt: async () => true
    }
  )

  assert.equal(saved?.prenom, 'Ada')
  assert.equal(result.emailSent, true)
  assert.equal(result.saved?.id, '1')
})
