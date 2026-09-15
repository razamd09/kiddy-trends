const PAKISTAN_TZ = 'Asia/Karachi'

// `created_at` columns on orders/customers are Postgres `timestamp without
// time zone`, storing a UTC wall-clock value with no offset attached (the DB
// session timezone is UTC). Supabase/PostgREST serializes that as a naked
// string like "2026-09-14 16:40:33" with no "Z"/offset, which `new Date()`
// would otherwise parse as the *viewer's own browser* local time instead of
// UTC. Treat it as UTC explicitly, then render in Pakistan time so every
// viewer sees the actual local time the order was placed.
function toUtcDate(rawTimestamp) {
  if (!rawTimestamp) return null
  const text = String(rawTimestamp).trim()
  if (!text) return null
  const hasTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(text)
  const isoText = hasTimezone ? text : text.replace(' ', 'T') + 'Z'
  const date = new Date(isoText)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatPakistanDateTime(rawTimestamp, options) {
  const date = toUtcDate(rawTimestamp)
  if (!date) return ''
  return date.toLocaleString('en-PK', { timeZone: PAKISTAN_TZ, ...options })
}

export function formatPakistanDate(rawTimestamp, options) {
  const date = toUtcDate(rawTimestamp)
  if (!date) return ''
  return date.toLocaleDateString('en-PK', { timeZone: PAKISTAN_TZ, ...options })
}
