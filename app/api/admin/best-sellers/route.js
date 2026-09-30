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

// Date-range presets, computed in Pakistan time (UTC+5, no DST) — same
// convention as the Sale report, so "Today"/"This Week" line up with the
// business's actual calendar day/week, not a UTC one that can be several
// hours off from what a Pakistan-based admin means by "today".
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000

function toPktWallClock(date) {
    return new Date(date.getTime() + PKT_OFFSET_MS)
}
function toRealUtc(pktWallClockDate) {
    return new Date(pktWallClockDate.getTime() - PKT_OFFSET_MS)
}
function addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}
function startOfPktDay(realUtcDate) {
    const w = toPktWallClock(realUtcDate)
    return toRealUtc(new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate())))
}
function startOfPktWeek(realUtcDate) {
    const w = toPktWallClock(realUtcDate)
    const isoDay = w.getUTCDay() || 7 // Monday-start
    return toRealUtc(new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate() - isoDay + 1)))
}
function startOfPktMonth(realUtcDate) {
    const w = toPktWallClock(realUtcDate)
    return toRealUtc(new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), 1)))
}

function getRangeForPreset(preset) {
    const now = new Date()
    if (preset === 'today') {
        const from = startOfPktDay(now)
        return { from, to: addDays(from, 1) }
    }
    if (preset === 'yesterday') {
        const todayStart = startOfPktDay(now)
        return { from: addDays(todayStart, -1), to: todayStart }
    }
    if (preset === 'this_week') {
        return { from: startOfPktWeek(now), to: now }
    }
    if (preset === 'last_week') {
        const thisWeekStart = startOfPktWeek(now)
        return { from: addDays(thisWeekStart, -7), to: thisWeekStart }
    }
    if (preset === 'this_month') {
        return { from: startOfPktMonth(now), to: now }
    }
    return null // 'all' — no range filter
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

        const { searchParams } = new URL(request.url)
        const preset = (searchParams.get('preset') || 'all').trim()
        const range = getRangeForPreset(preset)

        let query = supabase
            .from('orders')
            .select('id, items, status, created_at')
            .neq('status', 'cancelled')
        if (range) {
            query = query.gte('created_at', range.from.toISOString()).lt('created_at', range.to.toISOString())
        }

        const { data, error } = await query

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

        return Response.json({ success: true, products, preset })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
