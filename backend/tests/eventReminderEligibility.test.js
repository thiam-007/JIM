import test from 'node:test'
import assert from 'node:assert/strict'
import { isBeforeEventDay } from '../src/utils/eventReminderEligibility.js'

test('allows reminders only before the event calendar day', () => {
  const eventStart = '2026-11-12T18:00:00.000Z'

  assert.equal(isBeforeEventDay(eventStart, new Date('2026-11-11T23:59:59.000Z')), true)
  assert.equal(isBeforeEventDay(eventStart, new Date('2026-11-12T00:00:00.000Z')), false)
  assert.equal(isBeforeEventDay(eventStart, new Date('2026-11-13T00:00:00.000Z')), false)
})

test('rejects missing or invalid event dates', () => {
  assert.equal(isBeforeEventDay(null, new Date('2026-11-11T00:00:00.000Z')), false)
  assert.equal(isBeforeEventDay('not-a-date', new Date('2026-11-11T00:00:00.000Z')), false)
})
