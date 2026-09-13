import { sendMetaEvent } from '../../../lib/metaConversionsApi'

const ALLOWED_EVENTS = new Set(['ViewContent', 'AddToCart', 'InitiateCheckout'])

function firstHeader(request, keys) {
    for (const key of keys) {
        const value = request.headers.get(key)
        if (value && String(value).trim()) return String(value).trim()
    }
    return ''
}

// Relays ViewContent/AddToCart/InitiateCheckout to Meta's Conversions API
// from the server. Purchase is sent server-side directly from the checkout
// route instead (it already has full order/customer context there); these
// three only ever happen client-side (product view, cart add, checkout
// modal open), so they need this small relay to get a server-side leg at
// all, matching how Shopify sends every core event from both browser and
// server.
export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}))
        const eventName = String(body?.event_name || '').trim()
        if (!ALLOWED_EVENTS.has(eventName)) {
            return Response.json({ success: false, error: 'Unsupported event_name' }, { status: 400 })
        }

        const forwardedFor = firstHeader(request, ['x-forwarded-for', 'x-vercel-forwarded-for', 'cf-connecting-ip', 'true-client-ip', 'x-real-ip'])
        const clientIp = forwardedFor.includes(',') ? forwardedFor.split(',')[0].trim() : forwardedFor
        const host = firstHeader(request, ['host', 'x-forwarded-host'])
        const referrer = firstHeader(request, ['referer', 'referrer'])

        await sendMetaEvent({
            eventName,
            eventId: body?.event_id,
            value: body?.value,
            currency: body?.currency || 'PKR',
            contentIds: Array.isArray(body?.content_ids) ? body.content_ids.map(String) : [],
            contentName: body?.content_name,
            clientIp,
            userAgent: firstHeader(request, ['user-agent']),
            eventSourceUrl: referrer || (host ? `https://${host}` : undefined),
            cookieHeader: request.headers.get('cookie'),
        })

        return Response.json({ success: true })
    } catch (error) {
        // Best-effort tracking relay — never surface a hard error to the UI.
        console.log('meta-event relay error:', error.message)
        return Response.json({ success: false })
    }
}
