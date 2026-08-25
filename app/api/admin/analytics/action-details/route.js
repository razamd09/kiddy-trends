import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const ACTION_EVENT_MAP = {
  landingWebsite: 'landing',
  productViews: 'product_view',
  addToCart: 'add_to_cart',
  checkoutInitiated: 'checkout_started',
  checkoutCompleted: 'checkout_completed',
}

async function validateAdmin(request) {
  const token = request.headers.get('x-admin-token')
  if (!token) return false

  const { data } = await supabase
    .from('admin_sessions')
    .select('token')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  return !!data
}

function sanitizeAction(value) {
  const action = String(value || '').trim()
  return ACTION_EVENT_MAP[action] ? action : ''
}

export async function GET(request) {
  try {
    const valid = await validateAdmin(request)
    if (!valid) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const action = sanitizeAction(searchParams.get('action'))
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10), 1), 365)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '200', 10), 1), 500)

    if (!action) {
      return Response.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    const eventName = ACTION_EVENT_MAP[action]
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('website_analytics_events')
      .select('id, session_id, event_name, path, product_id, order_number, metadata, created_at')
      .eq('event_name', eventName)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    const rows = (data || []).map((row) => ({
      id: row.id,
      created_at: row.created_at,
      session_id: row.session_id || '',
      path: row.path || '',
      product_id: row.product_id || '',
      order_number: row.order_number || '',
      ip: row?.metadata?.ip || row?.metadata?.client_ip || '',
      user_agent: row?.metadata?.user_agent || row?.metadata?.client_user_agent || row?.metadata?.ua || '',
      referrer: row?.metadata?.referrer || '',
      host: row?.metadata?.host || '',
      metadata: row?.metadata || {},
    }))

    return Response.json({
      success: true,
      action,
      eventName,
      since,
      count: rows.length,
      rows,
    })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
