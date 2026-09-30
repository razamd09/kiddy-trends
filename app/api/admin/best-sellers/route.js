import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

async function validateAdmin(request) {
    const token = request.headers.get('x-admin-token')
    if (!token) return false
    const { data: session } = await supabase
        .from('admin_sessions')
        .select('token')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single()
    return !!session
}

function normalizeTitle(title) {
    return String(title || '').trim().replace(/\s+/g, ' ')
}

// Ranks products by how many distinct website orders included them (not
// total quantity — the ask was specifically "number of orders", so a
// customer buying 5 of one item in a single order counts once, the same as
// buying 1). Cancelled orders are excluded, same convention as the Sale
// screen — a cancelled order never became a real sale.
export async function GET(request) {
    try {
        const valid = await validateAdmin(request)
        if (!valid) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { data, error } = await supabase
            .from('orders')
            .select('id, items, status')
            .neq('status', 'cancelled')

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

        const byTitle = new Map()
        for (const order of data || []) {
            const items = Array.isArray(order.items) ? order.items : []
            const seenInThisOrder = new Set()
            for (const item of items) {
                const title = normalizeTitle(item?.title)
                if (!title || seenInThisOrder.has(title)) continue
                seenInThisOrder.add(title)

                const entry = byTitle.get(title) || { title, image: item?.image || null, orderCount: 0 }
                entry.orderCount += 1
                if (!entry.image && item?.image) entry.image = item.image
                byTitle.set(title, entry)
            }
        }

        const products = Array.from(byTitle.values()).sort((a, b) => b.orderCount - a.orderCount)

        return Response.json({ success: true, products })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
