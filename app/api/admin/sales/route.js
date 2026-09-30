import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

// Flat per-order shipping charge, matching the site's active "Standard
// Shipping" rate (Rs. 250) — PostEx orders don't carry their own shipping
// figure, only the single COD total (invoice_payment), so there's nothing
// per-order to read this from.
const FLAT_SHIPPING_PER_ORDER = 250

// Bucket boundaries are computed in Pakistan time (UTC+5, no DST) rather
// than UTC — an order booked at 1am PKT is UTC-previous-day, and a "Daily
// Sale" report using raw UTC dates would silently misfile it into the
// wrong day for a Pakistan-based business.
function toPKT(date) {
    return new Date(date.getTime() + 5 * 60 * 60 * 1000)
}

function dayKey(d) {
    return toPKT(d).toISOString().slice(0, 10)
}

function weekKey(d) {
    const pkt = toPKT(d)
    const isoDay = pkt.getUTCDay() || 7 // Monday-start week
    const monday = new Date(pkt)
    monday.setUTCDate(pkt.getUTCDate() - isoDay + 1)
    return monday.toISOString().slice(0, 10)
}

function monthKey(d) {
    return toPKT(d).toISOString().slice(0, 7) + '-01'
}

function toRow(dateKey, orders, totalSale) {
    const shipping = orders * FLAT_SHIPPING_PER_ORDER
    return { date: dateKey, orders, totalSale, shipping, netSale: totalSale - shipping }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const range = ['weekly', 'monthly'].includes(searchParams.get('range')) ? searchParams.get('range') : 'daily'

        // Cancelled orders never shipped, so they aren't a real sale — and
        // an order with no booked_at never actually made it to PostEx.
        const { data, error } = await supabase
            .from('instagram_orders')
            .select('booked_at, invoice_payment')
            .is('cancelled_at', null)
            .not('booked_at', 'is', null)

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

        const keyFn = range === 'weekly' ? weekKey : range === 'monthly' ? monthKey : dayKey
        const buckets = new Map()
        for (const r of data || []) {
            const key = keyFn(new Date(r.booked_at))
            const bucket = buckets.get(key) || { orders: 0, totalSale: 0 }
            bucket.orders += 1
            bucket.totalSale += Number(r.invoice_payment) || 0
            buckets.set(key, bucket)
        }
        const rows = Array.from(buckets.entries())
            .map(([key, b]) => toRow(key, b.orders, b.totalSale))
            .sort((a, b) => b.date.localeCompare(a.date))

        const todayStr = dayKey(new Date())
        const todaysOrders = (data || []).filter((r) => dayKey(new Date(r.booked_at)) === todayStr)
        const todayRow = toRow(
            todayStr,
            todaysOrders.length,
            todaysOrders.reduce((sum, r) => sum + (Number(r.invoice_payment) || 0), 0)
        )

        return Response.json({ success: true, range, rows, todayRow, flatShippingPerOrder: FLAT_SHIPPING_PER_ORDER })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
