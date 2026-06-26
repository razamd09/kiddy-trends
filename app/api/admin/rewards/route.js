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

    const users = (data || []).map((user) => {
        const totalSpent = Number(user.total_spent || 0)
        const availablePoints = Math.max(0, Number(user.points || 0))
        const baseEarned = Math.floor(totalSpent / 1000) * POINTS_PER_1000
        const bonusPoints = user.bonus_notified ? BONUS_POINTS : 0
        const totalEarned = Math.max(0, baseEarned + bonusPoints)
        const redeemedPoints = Math.max(0, totalEarned - availablePoints)

        return {
            ...user,
            total_earned_points: totalEarned,
            redeemed_points: redeemedPoints,
            available_points: availablePoints,
            last_activity_at: user.updated_at || user.created_at || null,
        }
    })

    return Response.json({ users, total: users.length })
}
