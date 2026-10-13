import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

async function validateAdmin(request) {
    const adminToken = request.headers.get('x-admin-token')
    if (!adminToken) return false
    const { data: session } = await supabase
        .from('admin_sessions')
        .select('token')
        .eq('token', adminToken)
        .gt('expires_at', new Date().toISOString())
        .single()
    return !!session
}

// Same PKT bucketing as /api/admin/sales — kept in lockstep so a drill-down's
// order list always matches the row it was opened from.
function toPKT(date) {
    return new Date(date.getTime() + 5 * 60 * 60 * 1000)
}
function dayKey(d) {
    return toPKT(d).toISOString().slice(0, 10)
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

// Per-date (or per-week/month) drill-down behind the Sale report's rows —
// lists each booked order's customer/city/amount instead of just the totals.
export async function GET(request) {
    try {
        const valid = await validateAdmin(request)
        if (!valid) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const range = ['weekly', 'monthly'].includes(searchParams.get('range')) ? searchParams.get('range') : 'daily'
        const dateKey = (searchParams.get('date') || '').trim()
        if (!dateKey) return Response.json({ success: false, error: 'date is required' }, { status: 400 })

        const { data, error } = await supabase
            .from('instagram_orders')
            .select('id, customer_name, city_name, invoice_payment, booked_at')
            .is('cancelled_at', null)
            .not('booked_at', 'is', null)

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

        const keyFn = range === 'weekly' ? weekKey : range === 'monthly' ? monthKey : dayKey
        const orders = (data || [])
            .filter((r) => keyFn(new Date(r.booked_at)) === dateKey)
            .map((r) => ({
                id: r.id,
                customerName: r.customer_name || 'Unknown',
                city: r.city_name || '—',
                amount: Number(r.invoice_payment) || 0,
                bookedAt: r.booked_at,
            }))
            .sort((a, b) => new Date(a.bookedAt) - new Date(b.bookedAt))

        const total = orders.reduce((sum, o) => sum + o.amount, 0)

        return Response.json({ success: true, date: dateKey, range, orders, total })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
