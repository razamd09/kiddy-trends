import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const ALLOWED_EVENTS = new Set([
  'landing',
  'page_view',
  'product_view',
  'add_to_cart',
  'checkout_started',
  'checkout_completed',
])

function sanitizeText(value, maxLen = 200) {
  const text = String(value || '').trim()
  return text.slice(0, maxLen)
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))

    const event_name = sanitizeText(body?.event_name || body?.eventName, 64)
    const session_id = sanitizeText(body?.session_id || body?.sessionId, 128)

    if (!event_name || !ALLOWED_EVENTS.has(event_name)) {
      return Response.json({ success: false, error: 'Invalid event_name' }, { status: 400 })
    }

    if (!session_id) {
      return Response.json({ success: false, error: 'session_id is required' }, { status: 400 })
    }

    const payload = {
      session_id,
      event_name,
      path: sanitizeText(body?.path, 300) || null,
      product_id: sanitizeText(body?.product_id || body?.productId, 120) || null,
      order_number: sanitizeText(body?.order_number || body?.orderNumber, 120) || null,
      metadata: body?.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    }

    const { error } = await supabase
      .from('website_analytics_events')
      .insert([payload])

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
