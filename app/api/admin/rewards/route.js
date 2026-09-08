import { createClient } from '@supabase/supabase-js'

const POINTS_PER_1000 = 25
const BONUS_POINTS = 100

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

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

    const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('updated_at', { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })

    const phones = new Set((data || []).flatMap((user) => [user.phone, user.whatsapp].filter(Boolean)))
    const emailByPhone = {}
    if (phones.size > 0) {
        // Fetched unfiltered and matched in JS rather than via a Supabase
        // .or() filter string — phone numbers contain '+', which gets mangled
        // when built into a raw PostgREST OR filter (silently matches nothing).
        const { data: orderRows } = await supabase
            .from('orders')
            .select('customer_phone, customer_whatsapp, customer_email, created_at')
            .order('created_at', { ascending: false })

        for (const order of orderRows || []) {
            const email = String(order.customer_email || '').trim()
            if (!email) continue
            if (phones.has(order.customer_phone) && !emailByPhone[order.customer_phone]) emailByPhone[order.customer_phone] = email
            if (phones.has(order.customer_whatsapp) && !emailByPhone[order.customer_whatsapp]) emailByPhone[order.customer_whatsapp] = email
        }
    }

    const users = (data || []).map((user) => {
        const totalSpent = Number(user.total_spent || 0)
        const availablePoints = Math.max(0, Number(user.points || 0))
        const baseEarned = Math.floor(totalSpent / 1000) * POINTS_PER_1000
        const bonusPoints = user.bonus_notified ? BONUS_POINTS : 0
        const totalEarned = Math.max(0, baseEarned + bonusPoints)
        const redeemedPoints = Math.max(0, totalEarned - availablePoints)

        return {
            ...user,
            email: emailByPhone[user.phone] || emailByPhone[user.whatsapp] || '',
            total_earned_points: totalEarned,
            redeemed_points: redeemedPoints,
            available_points: availablePoints,
            last_activity_at: user.updated_at || user.created_at || null,
        }
    })

    return Response.json({ users, total: users.length })
}
