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
