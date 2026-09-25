import { createClient } from '@supabase/supabase-js'
import { normalizePostExStatus } from '../../../../../lib/postexApi'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

// PostEx doesn't document a signature scheme the way Meta does, so the
// secret lives in the URL path itself (registered as the callback URL in
// the merchant dashboard) — unguessable is our whole auth story here.
function isValidSecret(secret) {
    return Boolean(process.env.POSTEX_WEBHOOK_SECRET) && secret === process.env.POSTEX_WEBHOOK_SECRET
}

// PostEx's push payload shape isn't published anywhere we could verify, so
// this tries every field-name PostEx is already confirmed (via trackOrder)
// to use for the pull API, plus a few likely variants. Once real traffic
// lands in postex_webhook_log we can tighten this to whatever it actually is.
function pick(obj, keys) {
    for (const key of keys) {
        const value = obj?.[key]
        if (value !== undefined && value !== null && value !== '') return value
    }
    return null
}

function extractEvent(payload) {
    // PostEx sometimes wraps the payload in a `dist` envelope like their
    // other API responses do — check both the top level and inside `dist`.
    const body = payload?.dist && typeof payload.dist === 'object' ? payload.dist : payload
    const trackingNumber = pick(body, ['trackingNumber', 'tracking_number', 'consignmentNumber', 'awb', 'AWB', 'trackNumber'])
    const orderRefNumber = pick(body, ['orderRefNumber', 'order_ref_number', 'orderReference'])
    const rawStatus = pick(body, ['transactionStatus', 'orderStatus', 'status', 'Status', 'transactionStatusMessage'])
    return { trackingNumber, orderRefNumber, rawStatus }
}

async function applyStatusUpdate({ trackingNumber, orderRefNumber, rawStatus }) {
    if (!rawStatus) return { matchedTable: null, matchedId: null }
    const normalized = normalizePostExStatus(rawStatus)

    if (trackingNumber) {
        const { data: igOrder } = await supabase
            .from('instagram_orders')
            .select('id')
            .eq('tracking_number', trackingNumber)
            .maybeSingle()
        if (igOrder) {
            await supabase
                .from('instagram_orders')
                .update({ order_status: rawStatus, updated_at: new Date().toISOString() })
                .eq('id', igOrder.id)
            return { matchedTable: 'instagram_orders', matchedId: igOrder.id }
        }

        // Regular website orders never got a dedicated tracking-number column —
        // the AWB only ever lives inside the free-text notes field (see
        // extractTrackingNumber in app/api/orders/track/route.js).
        const { data: siteOrders } = await supabase
            .from('orders')
            .select('id, notes')
            .ilike('notes', '%AWB: ' + trackingNumber + '%')
            .limit(1)
        const siteOrder = siteOrders?.[0]
        if (siteOrder) {
            await supabase.from('orders').update({ status: normalized }).eq('id', siteOrder.id)
            return { matchedTable: 'orders', matchedId: siteOrder.id }
        }
    }

    if (orderRefNumber) {
        const { data: igOrder } = await supabase
            .from('instagram_orders')
            .select('id')
            .eq('order_ref_number', orderRefNumber)
            .maybeSingle()
        if (igOrder) {
            await supabase
                .from('instagram_orders')
                .update({ order_status: rawStatus, updated_at: new Date().toISOString() })
                .eq('id', igOrder.id)
            return { matchedTable: 'instagram_orders', matchedId: igOrder.id }
        }
    }

    return { matchedTable: null, matchedId: null }
}

// Simple reachability check — PostEx's dashboard may ping the URL when you
// save it. No documented handshake protocol to mirror, so just confirm the
// secret and return 200.
export async function GET(request, { params }) {
    const { secret } = await params
    if (!isValidSecret(secret)) return new Response('Forbidden', { status: 403 })
    return new Response('OK', { status: 200 })
}

export async function POST(request, { params }) {
    const { secret } = await params
    const secretValid = isValidSecret(secret)

    const rawBody = await request.text()
    let payload
    try {
        payload = JSON.parse(rawBody)
    } catch {
        payload = { unparseable_raw_body: rawBody }
    }

    const event = extractEvent(payload)

    // Log every delivery BEFORE the secret check and BEFORE we know if we can
    // match it to an order — a bad secret or an unrecognized payload shape
    // should never look identical to "PostEx isn't calling us at all". Must
    // be awaited: an unawaited insert can be killed mid-flight once the
    // response below is sent, in a serverless environment.
    let logId = null
    try {
        const { data } = await supabase
            .from('postex_webhook_log')
            .insert([{
                raw_body: { ...payload, _secretValid: secretValid },
                secret_valid: secretValid,
                tracking_number: event.trackingNumber || null,
            }])
            .select('id')
            .single()
        logId = data?.id || null
    } catch (err) {
        console.log('PostEx webhook log error:', err)
    }

    if (!secretValid) {
        return new Response('Forbidden', { status: 403 })
    }

    try {
        const { matchedTable, matchedId } = await applyStatusUpdate(event)
        if (logId && matchedTable) {
            await supabase.from('postex_webhook_log').update({ matched_table: matchedTable, matched_id: matchedId }).eq('id', logId)
        }
    } catch (err) {
        console.log('PostEx webhook processing error:', err)
    }

    return new Response('OK', { status: 200 })
}
