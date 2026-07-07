import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

function normalizePkPhone(phone) {
    let digits = String(phone || '').replace(/\D/g, '')
    if (!digits) return null
    if (digits.startsWith('92') && digits.length > 10) digits = digits.slice(2)
    if (digits.startsWith('0') && digits.length > 10) digits = digits.slice(1)
    if (digits.length !== 10) return null
    return {
        e164: '+92' + digits,
        waTo: '92' + digits,
    }
}

async function resolveUserPhone(userId, rewardsPhone) {
    const direct = normalizePkPhone(rewardsPhone)
    if (direct) return direct

    const [notesOrderRes, emailOrderRes] = await Promise.all([
        supabase
            .from('orders')
            .select('customer_whatsapp, customer_phone')
            .ilike('notes', '%[Rewards] ' + userId + '%')
            .order('created_at', { ascending: false })
            .limit(1),
        userId.includes('@')
            ? supabase
                .from('orders')
                .select('customer_whatsapp, customer_phone')
                .ilike('customer_email', userId)
                .order('created_at', { ascending: false })
                .limit(1)
            : Promise.resolve({ data: [] }),
    ])

    const fromNotes = notesOrderRes?.data?.[0]
    const fromEmail = emailOrderRes?.data?.[0]
    const candidates = [
        fromNotes?.customer_whatsapp,
        fromNotes?.customer_phone,
        fromEmail?.customer_whatsapp,
        fromEmail?.customer_phone,
    ]

    for (const candidate of candidates) {
        const normalized = normalizePkPhone(candidate)
        if (normalized) return normalized
    }
    return null
}

async function sendWhatsAppPromotion({ to, name, points }) {
    const accessToken = [
        process.env.WHATSAPP_CLOUD_API_TOKEN,
        process.env.WHATSAPP_ACCESS_TOKEN,
        process.env.META_WHATSAPP_ACCESS_TOKEN,
    ].find((value) => typeof value === 'string' && value.trim())

    const phoneNumberId = [
        process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID,
        process.env.WHATSAPP_PHONE_NUMBER_ID,
        process.env.META_WHATSAPP_PHONE_NUMBER_ID,
    ].find((value) => typeof value === 'string' && value.trim())

    const shopUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kiddy-trends.vercel.app/collections'

    const missingVars = []
    if (!accessToken) missingVars.push('WHATSAPP_CLOUD_API_TOKEN')
    if (!phoneNumberId) missingVars.push('WHATSAPP_CLOUD_PHONE_NUMBER_ID')
    if (missingVars.length > 0) {
        throw new Error('WhatsApp API is not configured. Missing: ' + missingVars.join(', '))
    }

    const safePoints = Math.max(0, Number(points || 0))
    const customerName = (name || '').trim() || 'Valued Customer'
    const messageText = [
        'Assalam o Alaikum ' + customerName + '!',
        'You have ' + safePoints + ' reward points available.',
        'You can use these as PKR ' + safePoints.toLocaleString() + ' discount on your next order.',
        'Shop now - our new arrivals are live: ' + shopUrl,
    ].join('\n')

    const response = await fetch('https://graph.facebook.com/v20.0/' + phoneNumberId + '/messages', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + accessToken,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: {
                preview_url: true,
                body: messageText,
            },
        }),
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
        const errorMsg = payload?.error?.message || 'Failed to send WhatsApp promotion.'
        throw new Error(errorMsg)
    }

    return payload
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
        const userId = String(body?.userId || '').toLowerCase().trim()
        if (!userId) {
            return Response.json({ error: 'userId is required' }, { status: 400 })
        }

        const { data: rewardUser, error: rewardError } = await supabase
            .from('rewards')
            .select('user_id, name, phone, points')
            .eq('user_id', userId)
            .single()

        if (rewardError || !rewardUser) {
            return Response.json({ error: 'Rewards user not found' }, { status: 404 })
        }

        const availablePoints = Math.max(0, Number(rewardUser.points || 0))
        if (availablePoints <= 0) {
            return Response.json({ error: 'No available points to promote' }, { status: 400 })
        }

        const targetPhone = await resolveUserPhone(userId, rewardUser.phone)
        if (!targetPhone) {
            return Response.json({ error: 'No valid customer phone/WhatsApp number found' }, { status: 400 })
        }

        const waResult = await sendWhatsAppPromotion({
            to: targetPhone.waTo,
            name: rewardUser.name,
            points: availablePoints,
        })

        return Response.json({
            success: true,
            userId,
            points: availablePoints,
            sentTo: targetPhone.e164,
            messageId: waResult?.messages?.[0]?.id || null,
        })
    } catch (error) {
        return Response.json({ error: error.message || 'Failed to send promotion' }, { status: 500 })
    }
}
