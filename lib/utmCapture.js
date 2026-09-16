const UTM_STORAGE_KEY = 'kt_utm_attribution'
const UTM_PARAM_NAMES = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
const CLICK_ID_PARAM_NAMES = ['fbclid', 'gclid', 'ttclid']

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

// Reads utm_* and ad click-id params (fbclid/gclid/ttclid) from the current
// URL and — only if any are present — overwrites the stored attribution for
// this browser tab session. A fresh ad click always wins; plain internal
// navigation (no utm params in the URL) leaves whatever was captured earlier
// in the session untouched, so attribution survives as the visitor browses
// through to checkout.
export function captureUtmParams() {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  const captured = {}

  UTM_PARAM_NAMES.forEach((name) => {
    const value = params.get(name)
    if (value) captured[name] = value.trim().slice(0, 200)
  })
  CLICK_ID_PARAM_NAMES.forEach((name) => {
    const value = params.get(name)
    if (value) captured[name] = value.trim().slice(0, 200)
  })

  if (Object.keys(captured).length === 0) return

  captured.landing_page = window.location.pathname
  captured.captured_at = new Date().toISOString()
  safeSessionSet(UTM_STORAGE_KEY, JSON.stringify(captured))
}

export function getStoredUtmParams() {
  const raw = safeSessionGet(UTM_STORAGE_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}
