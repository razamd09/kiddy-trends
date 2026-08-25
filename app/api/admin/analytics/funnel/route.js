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

function rate(next, current) {
  if (current <= 0) return 0
  return Math.round((next / current) * 100)
}

function uniqueSessionCount(list, eventName) {
  return new Set(
    list
      .filter((item) => item.event_name === eventName)
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
    funnel: {
      landingUsers: 0,
      productView: 0,
      addToCart: 0,
      checkoutStarted: 0,
      checkoutCompleted: 0,
    },
    dropOff: {
      landingToView: 0,
      viewToCart: 0,
      cartToCheckout: 0,
      checkoutToComplete: 0,
    },
    conversion: {
      landingToViewPct: 0,
      viewToCartPct: 0,
      cartToCheckoutPct: 0,
      checkoutToCompletePct: 0,
      landingToCompletePct: 0,
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

    const uniqueLandingSessions = uniqueSessionCount(list, 'landing')
    const productViews = uniqueSessionCount(list, 'product_view')
    const addToCart = uniqueSessionCount(list, 'add_to_cart')
    const checkoutStarted = uniqueSessionCount(list, 'checkout_started')
    const checkoutCompleted = uniqueSessionCount(list, 'checkout_completed')

    const dropLandingToView = Math.max(0, uniqueLandingSessions - productViews)
    const dropViewToCart = Math.max(0, productViews - addToCart)
    const dropCartToCheckout = Math.max(0, addToCart - checkoutStarted)
    const dropCheckoutToComplete = Math.max(0, checkoutStarted - checkoutCompleted)

    return Response.json({
      success: true,
      days,
      since,
      funnel: {
        landingUsers: toNumber(uniqueLandingSessions),
        productView: toNumber(productViews),
        addToCart: toNumber(addToCart),
        checkoutStarted: toNumber(checkoutStarted),
        checkoutCompleted: toNumber(checkoutCompleted),
      },
      dropOff: {
        landingToView: toNumber(dropLandingToView),
        viewToCart: toNumber(dropViewToCart),
        cartToCheckout: toNumber(dropCartToCheckout),
        checkoutToComplete: toNumber(dropCheckoutToComplete),
      },
      conversion: {
        landingToViewPct: rate(productViews, uniqueLandingSessions),
        viewToCartPct: rate(addToCart, productViews),
        cartToCheckoutPct: rate(checkoutStarted, addToCart),
        checkoutToCompletePct: rate(checkoutCompleted, checkoutStarted),
        landingToCompletePct: rate(checkoutCompleted, uniqueLandingSessions),
      },
    })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
