import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const POSTEX_TRACKING_URL = process.env.POSTEX_TRACKING_URL || 'https://postex.pk/api/tracking-order'
const POSTEX_TIMEOUT_MS = 12000

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

async function postExRequest(payload) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), POSTEX_TIMEOUT_MS)
    try {
        const headers = { 'Content-Type': 'application/json' }
        if (process.env.POSTEX_BEARER_TOKEN) headers.Authorization = 'Bearer ' + process.env.POSTEX_BEARER_TOKEN
        if (process.env.POSTEX_API_KEY) headers['x-api-key'] = process.env.POSTEX_API_KEY
        if (process.env.POSTEX_CLIENT_ID) headers['x-client-id'] = process.env.POSTEX_CLIENT_ID
        if (process.env.POSTEX_CLIENT_SECRET) headers['x-client-secret'] = process.env.POSTEX_CLIENT_SECRET

        const res = await fetch(POSTEX_TRACKING_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            cache: 'no-store',
            signal: controller.signal,
        })
        const raw = await res.text()
        let json = null
        let parseError = ''
        try {
            json = raw ? JSON.parse(raw) : null
        } catch (error) {
            parseError = error instanceof Error ? error.message : 'Invalid JSON response'
        }
        return { ok: res.ok, status: res.status, json, raw, parseError }
    } finally {
        clearTimeout(timer)
    }
}

function normalizePostExStatus(statusValue) {
    const status = String(statusValue || '').toLowerCase()
    if (!status) return 'processing'
    if (status.includes('deliver')) return 'delivered'
    if (status.includes('cancel') || status.includes('return') || status.includes('failed')) return 'cancelled'
    if (status.includes('dispatch') || status.includes('transit') || status.includes('ship') || status.includes('out for')) return 'dispatched'
    if (status.includes('process') || status.includes('book') || status.includes('pickup')) return 'processing'
    return 'processing'
}

function normalizeShipmentResponse(trackingNumber, response) {
    const body = response?.json || {}
    const shipment = body?.data || body?.result || body?.shipment || body?.order || body || {}
    const rawStatus = pick(shipment, ['status', 'shipment_status', 'current_status', 'tracking_status']) || body?.statusMessage || body?.message || ''
    const status = normalizePostExStatus(rawStatus)

    const historyRaw = pick(shipment, ['history', 'tracking_history', 'trackingHistory', 'events', 'statuses', 'activities'])
    const events = Array.isArray(historyRaw)
        ? historyRaw.map((event) => ({
            status: pick(event, ['status', 'title', 'state']) || '',
            description: pick(event, ['description', 'details', 'remarks', 'message']) || '',
            location: pick(event, ['location', 'city', 'hub']) || '',
            timestamp: pick(event, ['date', 'datetime', 'time', 'created_at', 'updated_at']) || '',
        }))
        : []

    return {
        provider: 'postex',
        tracking_number: trackingNumber,
        status,
        raw_status: String(rawStatus || ''),
        updated_at: pick(shipment, ['updated_at', 'last_updated', 'scan_date', 'date']) || '',
        events,
        raw: body,
    }
}

async function fetchPostExTracking(trackingNumber) {
    let lastError = ''
    const payloads = [
        { trackingNumber },
        { tracking_number: trackingNumber },
        { consignment_number: trackingNumber },
        { cn_number: trackingNumber },
    ]
    for (const payload of payloads) {
        try {
            const response = await postExRequest(payload)
            if (!response.ok) continue
            return normalizeShipmentResponse(trackingNumber, response)
        } catch (error) {
            lastError = error instanceof Error ? error.message : 'PostEx request failed'
        }
    }
    if (lastError) {
        return {
            provider: 'postex',
            tracking_number: trackingNumber,
            status: '',
            raw_status: '',
            updated_at: '',
            events: [],
            error: lastError,
        }
    }
    return null
}

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('order_number')?.toUpperCase().trim()
    const directTrackingNumber = searchParams.get('tracking_number')?.trim()

    if (!orderNumber && !directTrackingNumber) {
        return Response.json({ error: 'Order number or PostEx tracking number is required' }, { status: 400 })
    }

    if (!orderNumber && directTrackingNumber) {
        const shipmentOnly = await fetchPostExTracking(directTrackingNumber)
        if (!shipmentOnly) {
            return Response.json({ error: 'Tracking not found. Please check your PostEx tracking number.' }, { status: 404 })
        }
        return Response.json({
            success: true,
            order: null,
            shipment: shipmentOnly,
        })
    }

    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single()

    if (error || !data) {
        if (directTrackingNumber) {
            const shipmentOnly = await fetchPostExTracking(directTrackingNumber)
            if (shipmentOnly) {
                return Response.json({
                    success: true,
                    order: null,
                    shipment: shipmentOnly,
                })
            }
        }
        return Response.json({ error: 'Order not found. Please check your order number.' }, { status: 404 })
    }

    const trackingNumber = directTrackingNumber || extractTrackingNumber(data)
    const shipment = trackingNumber ? await fetchPostExTracking(trackingNumber) : null
    const order = {
        ...data,
        tracking_number: trackingNumber || null,
        status: shipment?.status || data.status,
    }

    return Response.json({
        success: true,
        order,
        shipment,
    })
}