import { createClient } from '@supabase/supabase-js'

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

    const { searchParams } = new URL(request.url)
    const userId = (searchParams.get('userId') || '').toLowerCase().trim()
    if (!userId) return Response.json({ history: [] })

    const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total, discount, notes, created_at, customer_name')
        .ilike('notes', '%[Rewards] ' + userId + '%')
        .order('created_at', { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })

    const history = (data || []).map((o) => {
        const note = o.notes || ''
        const redeemedMatch = note.match(/redeemed\s+(\d+)\s+pts/i)
        const earnedMatch = note.match(/earned\s+(\d+)\s+pts/i)
        const balanceMatch = note.match(/balance\s+(\d+)\s+pts/i)
        return {
            id: o.id,
            order_number: o.order_number || ('#' + o.id),
            total: Number(o.total || 0),
            discount: Number(o.discount || 0),
            created_at: o.created_at,
            customer_name: o.customer_name || '',
            redeemed_points: redeemedMatch ? Number(redeemedMatch[1]) : 0,
            earned_points: earnedMatch ? Number(earnedMatch[1]) : 0,
            balance_points: balanceMatch ? Number(balanceMatch[1]) : null,
        }
    })

    return Response.json({ history })
}
