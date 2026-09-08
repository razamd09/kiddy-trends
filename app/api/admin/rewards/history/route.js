import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const POINTS_PER_1000 = 25

export async function GET(request) {
    const token = request.headers.get('x-admin-token')
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: session } = await supabase
        .from('admin_sessions')
        .select('token')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single()

    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const phone = (searchParams.get('userId') || '').trim()
    if (!phone) return Response.json({ history: [] })

    // Match on the phone/whatsapp columns directly (not a raw .or() filter
    // string — the '+' in phone numbers gets mangled in a PostgREST OR
    // filter) so every order for this customer is found, not just the ones
    // whose notes happen to contain a "[Rewards] <phone>" tag written by the
    // live checkout flow. Older/backfilled reward accounts never had that
    // tag written, so relying on it alone hid their entire history.
    const [byPhone, byWhatsapp] = await Promise.all([
        supabase
            .from('orders')
            .select('id, order_number, total, discount, notes, status, created_at, customer_name')
            .eq('customer_phone', phone),
        supabase
            .from('orders')
            .select('id, order_number, total, discount, notes, status, created_at, customer_name')
            .eq('customer_whatsapp', phone),
    ])

    if (byPhone.error) return Response.json({ error: byPhone.error.message }, { status: 500 })
    if (byWhatsapp.error) return Response.json({ error: byWhatsapp.error.message }, { status: 500 })

    const ordersById = new Map()
    for (const order of [...(byPhone.data || []), ...(byWhatsapp.data || [])]) {
        ordersById.set(order.id, order)
    }

    // Cancelled orders never earned points (matches the live checkout logic
    // and the historical backfill), so they're left out of the ledger.
    const orders = [...ordersById.values()]
        .filter((o) => o.status !== 'cancelled')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    let runningBalance = 0
    const history = orders.map((o) => {
        const note = o.notes || ''
        const redeemedMatch = note.match(/redeemed\s+(\d+)\s+pts/i)
        const earnedMatch = note.match(/earned\s+(\d+)\s+pts/i)
        const balanceMatch = note.match(/balance\s+(\d+)\s+pts/i)

        // If this order went through the live rewards flow, its notes carry
        // the exact figures (including any redemption) — trust those. Older
        // orders that predate that tag get their points recomputed from the
        // order total using the same formula the live flow uses.
        const hasTaggedData = Boolean(earnedMatch || redeemedMatch || balanceMatch)
        const earnedPoints = earnedMatch ? Number(earnedMatch[1]) : Math.floor(Number(o.total || 0) / 1000) * POINTS_PER_1000
        const redeemedPoints = redeemedMatch ? Number(redeemedMatch[1]) : 0
        runningBalance = hasTaggedData && balanceMatch ? Number(balanceMatch[1]) : runningBalance + earnedPoints - redeemedPoints

        return {
            id: o.id,
            order_number: o.order_number || ('#' + o.id),
            total: Number(o.total || 0),
            discount: Number(o.discount || 0),
            created_at: o.created_at,
            customer_name: o.customer_name || '',
            redeemed_points: redeemedPoints,
            earned_points: earnedPoints,
            balance_points: runningBalance,
        }
    })

    // Most recent first for display.
    history.reverse()

    return Response.json({ history })
}
