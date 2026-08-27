/**
 * Invitation System Test Suite
 * Tests for email validation, normalization, QR codes, and check-in flow
 * 
 * Run with: node backend/tests/invitation-system-test.js
 */

import { normalizeEmail, isValidEmail, getEmailDomain, isProfessionalEmail } from '../src/utils/emailValidator.js'

console.log('🧪 Invitation System Test Suite\n')

// Test 1: Email Normalization
console.log('1️⃣  Email Normalization Tests:')
const testEmails = [
  { input: 'Test@Gmail.com', expected: 'test@gmail.com', desc: 'Uppercase conversion' },
  { input: '  test@gmail.com  ', expected: 'test@gmail.com', desc: 'Trimming spaces' },
  { input: 'USER@.GOV.gn', expected: 'user@.gov.gn', desc: 'Government domain' },
  { input: 'PROF@COMPANY.FR', expected: 'prof@company.fr', desc: 'French .fr domain' },
  { input: 'admin@localhost', expected: null, desc: 'Restricted domain (localhost)' },
  { input: 'test@example.com', expected: null, desc: 'Restricted domain (example.com)' },
  { input: 'invalid.email', expected: null, desc: 'Missing @ symbol' },
  { input: 'test@', expected: null, desc: 'Missing domain' },
  { input: '@domain.com', expected: null, desc: 'Missing local part' }
]

testEmails.forEach(({ input, expected, desc }) => {
  const result = normalizeEmail(input)
  const passed = result === expected
  console.log(`  ${passed ? '✅' : '❌'} ${desc}: "${input}" → "${result}" (expected: "${expected}")`)
})

// Test 2: Email Validation
console.log('\n2️⃣  Email Validation Tests:')
const validationTests = [
  { email: 'prof@company.fr', valid: true, desc: 'Valid .fr domain' },
  { email: 'USER@MINISTRY.GOV.gn', valid: true, desc: 'Uppercase accepted after normalization' },
  { email: 'user@ministry.gov.gn', valid: true, desc: 'Valid .gov.gn domain' },
  { email: 'newsletter@test.com', valid: false, desc: 'Test domain (restricted)' }
]

validationTests.forEach(({ email, valid, desc }) => {
  const result = isValidEmail(email)
  const passed = result === valid
  console.log(`  ${passed ? '✅' : '❌'} ${desc}: "${email}" → ${result}`)
})

// Test 3: Professional Email Detection
console.log('\n3️⃣  Professional Email Detection:')
const profTests = [
  { email: 'john@company.fr', isProfessional: true },
  { email: 'admin@ministry.gov.gn', isProfessional: true },
  { email: 'researcher@university.edu', isProfessional: true },
  { email: 'user@gmail.com', isProfessional: true },
  { email: 'invalid@localhost', isProfessional: false }
]

profTests.forEach(({ email, isProfessional: expected }) => {
  // Need to normalize first
  const normalized = normalizeEmail(email)
  const result = normalized ? isProfessionalEmail(normalized) : false
  const passed = result === expected
  console.log(`  ${passed ? '✅' : '❌'} "${email}" is professional: ${result}`)
})

// Test 4: Domain Extraction
console.log('\n4️⃣  Domain Extraction Tests:')
const domainTests = [
  { email: 'USER@COMPANY.FR', expected: 'company.fr' },
  { email: 'admin@ministry.gov.gn', expected: 'ministry.gov.gn' },
  { email: 'invalid@', expected: null }
]

domainTests.forEach(({ email, expected }) => {
  const result = getEmailDomain(email)
  const passed = result === expected
  console.log(`  ${passed ? '✅' : '❌'} "${email}" → domain: "${result}" (expected: "${expected}")`)
})

console.log('\n✨ Test suite complete!\n')

/**
 * Expected Issues to Check in Backend:
 * 1. Check if tokens are stored in lowercase (migration needed for existing data)
 * 2. Verify email normalization happens at invitation creation
 * 3. Test QR endpoint (both public and protected) returns correct data
 * 4. Verify check-in by token works case-insensitively
 * 5. Test email delivery with .fr, .gov, .gn domains
 * 6. Verify no duplicate email entries exist
 */
