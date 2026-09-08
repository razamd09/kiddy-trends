import { createClient } from '@supabase/supabase-js'
import { sendEmailWithEmailJs } from '../../customers/customer-data'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const PROMOTION_SUBJECT = 'Redeem Your Rewards in Cash'

function buildPromotionMessage(name) {
    return [
        'Hi ' + name,
        '',
        'Your Reward points are in Cash form. Just click and redeem in your next order.',
        '',
        'Order us now at thekiddytrends.com - Shop Now!',
    ].join('\n')
}

async function resolveCustomerEmail(phone) {
    if (!phone) return ''

    const [byPhone, byWhatsapp] = await Promise.all([
        supabase
            .from('orders')
            .select('customer_email, created_at')
            .eq('customer_phone', phone)
            .order('created_at', { ascending: false }),
        supabase
            .from('orders')
            .select('customer_email, created_at')
            .eq('customer_whatsapp', phone)
            .order('created_at', { ascending: false }),
    ])

    const rows = [...(byPhone.data || []), ...(byWhatsapp.data || [])]
        .filter((row) => String(row.customer_email || '').trim())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return rows[0]?.customer_email || ''
}

export async function POST(request) {
    try {
        const token = request.headers.get('x-admin-token')
        if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: session } = await supabase
            .from('admin_sessions')
            .select('token')
            .eq('token', token)
            .gt('expires_at', new Date().toISOString())
            .single()

        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json().catch(() => ({}))
        const userId = String(body?.userId || '').trim()
        if (!userId) {
            return Response.json({ error: 'userId is required' }, { status: 400 })
        }

        const { data: rewardUser, error: rewardError } = await supabase
            .from('rewards')
            .select('user_id, name, phone, whatsapp, points')
            .eq('user_id', userId)
            .single()

        if (rewardError || !rewardUser) {
            return Response.json({ error: 'Rewards user not found' }, { status: 404 })
        }

        const availablePoints = Math.max(0, Number(rewardUser.points || 0))
        if (availablePoints <= 0) {
            return Response.json({ error: 'No available points to promote' }, { status: 400 })
        }

        const email = await resolveCustomerEmail(rewardUser.phone) || await resolveCustomerEmail(rewardUser.whatsapp)
        if (!email) {
            return Response.json({ error: 'No email found for this customer' }, { status: 400 })
        }

        const name = String(rewardUser.name || '').trim() || 'there'
        await sendEmailWithEmailJs(email, PROMOTION_SUBJECT, buildPromotionMessage(name), name)

        return Response.json({
            success: true,
            userId,
            points: availablePoints,
            sentTo: email,
        })
    } catch (error) {
        return Response.json({ error: error.message || 'Failed to send promotion' }, { status: 500 })
    }
}
