import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

// Same PKT bucketing as /api/admin/sales and its /orders drill-down — kept
// in lockstep so a period here always lines up with the same calendar
// week/month a Pakistan-based admin expects.
function toPKT(date) {
    return new Date(date.getTime() + 5 * 60 * 60 * 1000)
}
function weekKey(d) {
    const pkt = toPKT(d)
    const isoDay = pkt.getUTCDay() || 7
    const monday = new Date(pkt)
    monday.setUTCDate(pkt.getUTCDate() - isoDay + 1)
    return monday.toISOString().slice(0, 10)
}
function monthKey(d) {
    return toPKT(d).toISOString().slice(0, 7) + '-01'
}

const STATUSES = ['pending', 'processing', 'dispatched', 'delivered', 'cancelled']

// Orders placed-per-period, broken down by current status — the Orders
// Reporting screen's Weekly/Monthly view.
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const range = searchParams.get('range') === 'monthly' ? 'monthly' : 'weekly'

        const { data, error } = await supabase
            .from('orders')
            .select('status, created_at')

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

        const keyFn = range === 'monthly' ? monthKey : weekKey
        const buckets = new Map()
        for (const r of data || []) {
            const key = keyFn(new Date(r.created_at))
            const bucket = buckets.get(key) || { pending: 0, processing: 0, dispatched: 0, delivered: 0, cancelled: 0, total: 0 }
            const status = STATUSES.includes(r.status) ? r.status : 'pending'
            bucket[status] += 1
            bucket.total += 1
            buckets.set(key, bucket)
        }

        const rows = Array.from(buckets.entries())
            .map(([date, b]) => ({ date, ...b }))
            .sort((a, b) => b.date.localeCompare(a.date))

        return Response.json({ success: true, range, rows })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
