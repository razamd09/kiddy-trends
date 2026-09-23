import { createClient } from '@supabase/supabase-js'
import { trackOrder } from '../../../../lib/postexApi'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function pick(obj, keys) {
    for (const key of keys) {
        const value = obj?.[key]
        if (value !== undefined && value !== null && value !== '') return value
    }
    return null
}

function extractTrackingNumber(order) {
    const direct = pick(order, [
        'tracking_number',
        'tracking_no',
        'awb',
        'awb_number',
        'consignment_number',
        'postex_tracking_number',
        'postex_awb',
        'courier_tracking_id',
    ])
    if (direct) return String(direct).trim()

    const notes = String(order?.notes || '')
    const match = notes.match(/\[PostEx\][^\n\r]*AWB:\s*([A-Za-z0-9-]+)/i)
    return match?.[1]?.trim() || null
}

function normalizePostExStatus(statusValue) {
    const status = String(statusValue || '').toLowerCase()
    if (!status) return 'processing'
    if (status.includes('deliver')) return 'delivered'
    if (status.includes('cancel') || status.includes('return') || status.includes('failed')) return 'cancelled'
    if (status.includes('dispatch') || status.includes('transit') || status.includes('picked') || status.includes('out for')) return 'dispatched'
    return 'processing' // covers Unbooked, Booked, "At Warehouse", etc.
}

// Uses our own verified PostEx integration (lib/postexApi.js) — the real
// response shape (confirmed live) uses transactionStatus /
// transactionStatusHistory, not the generic status/history field names a
// much older, speculative version of this route used to guess at.
async function fetchPostExTracking(trackingNumber) {
    const result = await trackOrder(trackingNumber)
    if (!result.success) {
        return { provider: 'postex', tracking_number: trackingNumber, status: '', raw_status: '', updated_at: '', events: [], error: result.error }
    }

    const rawStatus = result.transactionStatus || ''
    const events = (Array.isArray(result.transactionStatusHistory) ? result.transactionStatusHistory : [])
        .map((e) => ({
            status: e.transactionStatusMessage || '',
            description: '',
            location: '',
            timestamp: e.updatedAt || '',
        }))
        .reverse() // PostEx returns oldest-first; show most recent first

    return {
        provider: 'postex',
        tracking_number: trackingNumber,
        status: normalizePostExStatus(rawStatus),
        raw_status: rawStatus,
        updated_at: events[0]?.timestamp || '',
        events,
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('order_number')?.toUpperCase().trim()
    const directTrackingNumber = searchParams.get('tracking_number')?.trim()

    if (!orderNumber && !directTrackingNumber) {
        return Response.json({ error: 'Order number or PostEx tracking number is required' }, { status: 400 })
    }

    // Tracking-number-only search needs no local order record at all.
    if (!orderNumber && directTrackingNumber) {
        const shipmentOnly = await fetchPostExTracking(directTrackingNumber)
        if (shipmentOnly.error) {
            return Response.json({ error: 'Tracking not found. Please check your PostEx tracking number.' }, { status: 404 })
        }
        return Response.json({ success: true, order: null, shipment: shipmentOnly })
    }

    // Regular website checkout orders.
    const { data: websiteOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .maybeSingle()

    if (websiteOrder) {
        const trackingNumber = directTrackingNumber || extractTrackingNumber(websiteOrder)
        const shipment = trackingNumber ? await fetchPostExTracking(trackingNumber) : null
        const order = { ...websiteOrder, tracking_number: trackingNumber || null, status: shipment?.status || websiteOrder.status }
        return Response.json({ success: true, order, shipment })
    }

    // Instagram quick-entry orders — order_ref_number looks like "786-KT-...".
    const { data: igOrder } = await supabase
        .from('instagram_orders')
        .select('*')
        .eq('order_ref_number', orderNumber)
        .maybeSingle()

    if (igOrder && igOrder.tracking_number) {
        const shipment = await fetchPostExTracking(igOrder.tracking_number)
        const order = {
            order_number: igOrder.order_ref_number,
            customer_name: igOrder.customer_name,
            customer_city: igOrder.city_name,
            total: igOrder.invoice_payment,
            subtotal: igOrder.invoice_payment,
            shipping: 0,
            items: igOrder.order_detail ? [{ title: igOrder.order_detail, quantity: igOrder.items || 1, price: igOrder.invoice_payment }] : [],
            created_at: igOrder.created_at,
            tracking_number: igOrder.tracking_number,
            status: shipment?.status || 'processing',
        }
        return Response.json({ success: true, order, shipment })
    }

    // Neither table had it by order number — last resort, try it as a raw tracking number.
    if (directTrackingNumber) {
        const shipmentOnly = await fetchPostExTracking(directTrackingNumber)
        if (!shipmentOnly.error) {
            return Response.json({ success: true, order: null, shipment: shipmentOnly })
        }
    }

    return Response.json({ error: 'Order not found. Please check your order number.' }, { status: 404 })
}
