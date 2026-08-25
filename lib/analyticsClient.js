const SESSION_KEY = 'kt_analytics_session_id'
const LANDING_SENT_KEY = 'kt_analytics_landing_sent'

function safeSessionGet(key) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSessionSet(key, value) {
  try {
    sessionStorage.setItem(key, value)
  } catch {}
}

function generateSessionId() {
  const random = Math.random().toString(36).slice(2, 10)
  return 'sess_' + Date.now().toString(36) + '_' + random
}

export function getAnalyticsSessionId() {
  const existing = safeSessionGet(SESSION_KEY)
  if (existing) return existing
  const created = generateSessionId()
  safeSessionSet(SESSION_KEY, created)
  return created
}

export async function trackEvent(eventName, payload = {}) {
  try {
    const sessionId = getAnalyticsSessionId()
    const browserMetadata = {
      client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent || null : null,
      client_language: typeof navigator !== 'undefined' ? navigator.language || null : null,
      client_platform: typeof navigator !== 'undefined' ? navigator.platform || null : null,
    }

    const payloadMetadata = payload?.metadata && typeof payload.metadata === 'object'
      ? payload.metadata
      : {}

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        event_name: eventName,
        session_id: sessionId,
        ...payload,
        metadata: {
          ...payloadMetadata,
          ...browserMetadata,
        },
      }),
    })
  } catch {}
}

export function markLandingSent() {
  safeSessionSet(LANDING_SENT_KEY, '1')
}

export function hasLandingBeenSent() {
  return safeSessionGet(LANDING_SENT_KEY) === '1'
}
