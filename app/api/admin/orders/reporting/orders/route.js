import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

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

// Drill-down behind one Orders Reporting cell — every order in that
// period+status, with the cancellation reason surfaced when relevant.
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const range = searchParams.get('range') === 'monthly' ? 'monthly' : 'weekly'
        const dateKey = (searchParams.get('date') || '').trim()
        const status = STATUSES.includes(searchParams.get('status')) ? searchParams.get('status') : ''
        if (!dateKey) return Response.json({ success: false, error: 'date is required' }, { status: 400 })

        const { data, error } = await supabase
            .from('orders')
            .select('id, order_number, customer_name, customer_city, total, status, cancellation_reason, created_at')

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

        const keyFn = range === 'monthly' ? monthKey : weekKey
        const orders = (data || [])
            .filter((r) => keyFn(new Date(r.created_at)) === dateKey && (!status || r.status === status))
            .map((r) => ({
                id: r.id,
                orderNumber: r.order_number || ('#' + r.id),
                customerName: r.customer_name || 'Unknown',
                city: r.customer_city || '—',
                amount: Number(r.total) || 0,
                status: r.status,
                cancellationReason: r.cancellation_reason || '',
                createdAt: r.created_at,
            }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        return Response.json({ success: true, date: dateKey, range, status, orders })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
