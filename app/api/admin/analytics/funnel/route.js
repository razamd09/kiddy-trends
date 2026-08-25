import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

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

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function eventCount(list, eventName) {
  return list.filter((item) => item.event_name === eventName).length
}

function uniqueLandingCount(list) {
  return new Set(
    list
      .filter((item) => item.event_name === 'landing')
      .map((item) => item.session_id)
      .filter(Boolean)
  ).size
}

function emptyFunnelPayload(days, since) {
  return {
    success: true,
    days,
    since,
    setupRequired: true,
    setupMessage: 'Run add_website_analytics_events_table.sql in Supabase SQL editor, then refresh this page.',
    actions: {
      landingWebsite: 0,
      productViews: 0,
      addToCart: 0,
      checkoutInitiated: 0,
      checkoutCompleted: 0,
    },
  }
}

export async function GET(request) {
  try {
    const valid = await validateAdmin(request)
    if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10), 1), 365)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data: events, error } = await supabase
      .from('website_analytics_events')
      .select('session_id, event_name')
      .gte('created_at', since)

    if (error) {
      const message = String(error.message || '').toLowerCase()
      const missingTable =
        message.includes('could not find the table') ||
        message.includes('relation') ||
        message.includes('does not exist')

      if (missingTable) {
        return Response.json(emptyFunnelPayload(days, since))
      }

      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    const list = events || []

    const landingWebsite = uniqueLandingCount(list)
    const productViews = eventCount(list, 'product_view')
    const addToCart = eventCount(list, 'add_to_cart')
    const checkoutInitiated = eventCount(list, 'checkout_started')
    const checkoutCompleted = eventCount(list, 'checkout_completed')

    return Response.json({
      success: true,
      days,
      since,
      actions: {
        landingWebsite: toNumber(landingWebsite),
        productViews: toNumber(productViews),
        addToCart: toNumber(addToCart),
        checkoutInitiated: toNumber(checkoutInitiated),
        checkoutCompleted: toNumber(checkoutCompleted),
      },
    })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
