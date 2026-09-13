// Thin wrapper around the Meta (Facebook) Pixel's client-side fbq() call.
// Safe to call anywhere — no-ops during SSR or if the pixel script hasn't
// loaded yet (e.g. ad blockers), rather than throwing.

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '8362200723884208'

// eventId, when passed, must match the event_id sent server-side via the
// Conversions API for the same logical event (e.g. the order number for a
// Purchase) so Meta can deduplicate the two instead of double-counting.
export function metaPixelTrack(eventName, params = {}, eventId) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  try {
    if (eventId) {
      window.fbq('track', eventName, params, { eventID: String(eventId) })
    } else {
      window.fbq('track', eventName, params)
    }
  } catch {}
}

// A single id shared between the browser fbq() call and the server-side
// Conversions API call for the same logical action, so Meta deduplicates
// the two into one event instead of double-counting.
export function generateMetaEventId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

// Fire-and-forget relay to /api/meta-event, which forwards to Meta's
// Conversions API from the server. Used for the three events that only
// ever happen client-side (ViewContent, AddToCart, InitiateCheckout) so
// they get a server-side leg too, matching metaPixelTrack's browser call
// for the same eventId.
export function sendServerMetaEvent(eventName, params = {}, eventId) {
  if (typeof window === 'undefined') return
  try {
    fetch('/api/meta-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId,
        content_ids: params.content_ids,
        content_name: params.content_name,
        value: params.value,
        currency: params.currency,
      }),
    }).catch(() => {})
  } catch {}
}
