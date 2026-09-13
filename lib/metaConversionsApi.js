import crypto from 'crypto'

const META_PIXEL_ID = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || '8362200723884208'
const META_CAPI_ACCESS_TOKEN = process.env.META_CONVERSIONS_API_ACCESS_TOKEN || ''
const META_CAPI_TEST_EVENT_CODE = process.env.META_CONVERSIONS_API_TEST_EVENT_CODE || ''

function sha256(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return undefined
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

// Extracts _fbc/_fbp (Meta's click-id and browser-id cookies) from the raw
// Cookie header, when the browser sent them — improves match quality for
// the Conversions API event.
function parseFbCookies(cookieHeader) {
  const result = { fbc: undefined, fbp: undefined }
  if (!cookieHeader) return result

  for (const pair of cookieHeader.split(';')) {
    const [rawKey, ...rawVal] = pair.trim().split('=')
    const key = rawKey?.trim()
    const value = rawVal.join('=').trim()
    if (key === '_fbc' && value) result.fbc = value
    if (key === '_fbp' && value) result.fbp = value
  }
  return result
}

// Sends any standard event (ViewContent, AddToCart, InitiateCheckout,
// Purchase, ...) to Meta's Conversions API. No-ops (logs and returns) if
// META_CONVERSIONS_API_ACCESS_TOKEN isn't configured, so callers never fail
// checkout/browsing because of this being unset.
//
// eventId must match the eventID passed to the client-side
// fbq('track', eventName, ..., { eventID }) call for the same logical
// action, so Meta deduplicates the two into a single event instead of
// double-counting.
export async function sendMetaEvent({
  eventName,
  eventId,
  value,
  currency = 'PKR',
  contentIds = [],
  contentName,
  customerEmail,
  customerPhone,
  clientIp,
  userAgent,
  eventSourceUrl,
  cookieHeader,
}) {
  if (!META_CAPI_ACCESS_TOKEN) {
    console.log('Meta Conversions API skipped: META_CONVERSIONS_API_ACCESS_TOKEN not configured')
    return { skipped: true }
  }

  const { fbc, fbp } = parseFbCookies(cookieHeader)

  const eventPayload = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: String(eventId || ''),
    event_source_url: eventSourceUrl || undefined,
    action_source: 'website',
    user_data: {
      em: customerEmail ? [sha256(customerEmail)] : undefined,
      ph: customerPhone ? [sha256(String(customerPhone).replace(/\D/g, ''))] : undefined,
      client_ip_address: clientIp || undefined,
      client_user_agent: userAgent || undefined,
      fbc,
      fbp,
    },
    custom_data: {
      value: value !== undefined ? Number(value || 0) : undefined,
      currency,
      content_ids: contentIds,
      content_name: contentName || undefined,
      content_type: 'product',
      num_items: contentIds.length || undefined,
    },
  }

  const body = {
    data: [eventPayload],
    ...(META_CAPI_TEST_EVENT_CODE ? { test_event_code: META_CAPI_TEST_EVENT_CODE } : {}),
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      console.log('Meta Conversions API error:', JSON.stringify(result))
      return { skipped: false, error: result }
    }
    return { skipped: false, result }
  } catch (error) {
    console.log('Meta Conversions API request failed:', error.message)
    return { skipped: false, error: error.message }
  }
}

// Kept as a thin alias for the existing Purchase call site's readability.
export async function sendMetaPurchaseEvent(params) {
  return sendMetaEvent({ ...params, eventName: 'Purchase' })
}
