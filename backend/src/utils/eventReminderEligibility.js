export function isBeforeEventDay(dateStart, now = new Date()) {
  const eventStart = new Date(dateStart)
  const current = new Date(now)

  if (!dateStart || Number.isNaN(eventStart.getTime()) || Number.isNaN(current.getTime())) {
    return false
  }

  const currentDay = Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate())
  const eventDay = Date.UTC(eventStart.getUTCFullYear(), eventStart.getUTCMonth(), eventStart.getUTCDate())

  return currentDay < eventDay
}
