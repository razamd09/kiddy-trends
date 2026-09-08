import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'service_9p08wct'
const EMAILJS_REWARDS_TEMPLATE_ID = process.env.EMAILJS_REWARDS_TEMPLATE_ID || ''
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'G3OmrUP2PwOat-o1W'
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || ''
const PROMOTE_COOLDOWN_MS = 24 * 60 * 60 * 1000

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

// Sends via the dedicated "Rewards Redeem" EmailJS template (customer_name,
// points), not the Order Confirmation template — that one has no generic
// message field, so a rewards email through it would render with blank
// order fields instead of the rewards content.
async function sendRewardsEmail(toEmail, customerName, points) {
    if (!EMAILJS_REWARDS_TEMPLATE_ID) {
        throw new Error('Rewards email template is not configured. Set EMAILJS_REWARDS_TEMPLATE_ID.')
    }

    const payload = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_REWARDS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        accessToken: EMAILJS_PRIVATE_KEY || undefined,
        template_params: {
            to_email: toEmail,
            recipient_email: toEmail,
            email: toEmail,
            customer_email: toEmail,
            to_name: customerName,
            from_name: 'Kiddy Trends',
            reply_to: process.env.ORDER_NOTIFICATION_EMAIL || 'thekiddytrends@gmail.com',
            customer_name: customerName,
            points,
        },
    }

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Email send failed')
    }
}

function msSinceLastPromoted(lastPromotedAt) {
    if (!lastPromotedAt) return Infinity
    return Date.now() - new Date(lastPromotedAt).getTime()
}

// Promotes one rewards user: validates, sends the email, and records
// last_promoted_at on success. Returns a result object rather than
// throwing, so bulk sends can process every recipient and report per-user
// outcomes instead of one failure aborting the whole batch.
async function promoteOne(userId) {
    const { data: rewardUser, error: rewardError } = await supabase
        .from('rewards')
        .select('user_id, name, phone, whatsapp, points, last_promoted_at')
        .eq('user_id', userId)
        .single()

    if (rewardError || !rewardUser) {
        return { userId, success: false, error: 'Rewards user not found' }
    }

    const availablePoints = Math.max(0, Number(rewardUser.points || 0))
    if (availablePoints <= 0) {
        return { userId, success: false, error: 'No available points to promote' }
    }

    const cooldownRemainingMs = PROMOTE_COOLDOWN_MS - msSinceLastPromoted(rewardUser.last_promoted_at)
    if (cooldownRemainingMs > 0) {
        const hoursLeft = Math.ceil(cooldownRemainingMs / (60 * 60 * 1000))
        return { userId, success: false, error: 'Already emailed within the last 24 hours (try again in ~' + hoursLeft + 'h)' }
    }

    const email = await resolveCustomerEmail(rewardUser.phone) || await resolveCustomerEmail(rewardUser.whatsapp)
    if (!email) {
        return { userId, success: false, error: 'No email found for this customer' }
    }

    const name = String(rewardUser.name || '').trim() || 'there'

    try {
        await sendRewardsEmail(email, name, availablePoints)
    } catch (err) {
        return { userId, success: false, error: err.message || 'Failed to send email' }
    }

    await supabase
        .from('rewards')
        .update({ last_promoted_at: new Date().toISOString() })
        .eq('user_id', userId)

    return { userId, success: true, points: availablePoints, sentTo: email }
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
        const bulkUserIds = Array.isArray(body?.userIds) ? body.userIds.map((id) => String(id || '').trim()).filter(Boolean) : null
        const singleUserId = String(body?.userId || '').trim()

        if (bulkUserIds && bulkUserIds.length > 0) {
            const results = []
            // Sent one at a time rather than in parallel to stay well under
            // EmailJS's per-account rate limits when promoting many rows at once.
            for (const userId of bulkUserIds) {
                results.push(await promoteOne(userId))
            }
            return Response.json({ success: true, results })
        }

        if (!singleUserId) {
            return Response.json({ error: 'userId or userIds is required' }, { status: 400 })
        }

        const result = await promoteOne(singleUserId)
        if (!result.success) {
            return Response.json({ error: result.error }, { status: 400 })
        }

        return Response.json({ success: true, userId: result.userId, points: result.points, sentTo: result.sentTo })
    } catch (error) {
        return Response.json({ error: error.message || 'Failed to send promotion' }, { status: 500 })
    }
}
