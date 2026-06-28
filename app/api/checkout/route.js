import { createClient } from '@supabase/supabase-js'

const ORDER_NOTIFICATION_EMAIL = process.env.ORDER_NOTIFICATION_EMAIL || 'thekiddytrends@gmail.com'
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'service_9p08wct'
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || 'template_gyanmsp'
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'G3OmrUP2PwOat-o1W'
const POINTS_PER_1000 = 25
const BONUS_THRESHOLD = 500
const BONUS_POINTS = 100

function toNumber(value) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

function normalizePkPhoneDigits(value) {
    let digits = String(value || '').replace(/\D/g, '')
    if (digits.startsWith('92') && digits.length > 10) digits = digits.slice(2)
    if (digits.startsWith('0') && digits.length > 10) digits = digits.slice(1)
    return digits.slice(0, 10)
}

function buildPhoneVariants(phoneDigits) {
    return ['+92' + phoneDigits, '92' + phoneDigits, '0' + phoneDigits, phoneDigits]
}

async function sendOrderNotification({ orderNumber, customer, cartItems, subtotal, shipping, discount, total }) {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        console.log('Order email skipped: missing EmailJS configuration')
        return
    }

    const orderItemsText = (cartItems || [])
        .map((item, idx) => {
            const qty = item.quantity || 1
            const variantId = item.variantId || 'N/A'
            return (idx + 1) + '. Variant ' + variantId + ' x' + qty
        })
        .join('\n')

    const buildPayload = (toEmail) => ({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
            to_email: toEmail,
            recipient_email: toEmail,
            email: toEmail,
            customer_email: toEmail,
            buyer_email: customer.email || '',
            to_name: toEmail === ORDER_NOTIFICATION_EMAIL ? 'Kiddy Trends Admin' : (customer.name || 'Valued Customer'),
            from_name: 'Kiddy Trends',
            reply_to: customer.email || ORDER_NOTIFICATION_EMAIL,
            subject: 'Order Confirmation - ' + orderNumber,
            customer_name: customer.name || 'N/A',
            phone: customer.phone || '',
            address: customer.address || '',
            city: customer.city || '',
            order_number: orderNumber,
            order_items: orderItemsText,
            subtotal: 'PKR ' + Number(subtotal || 0).toLocaleString(),
            shipping: 'PKR ' + Number(shipping || 0).toLocaleString(),
            discount: 'PKR ' + Number(discount || 0).toLocaleString(),
            total: 'PKR ' + Number(total || 0).toLocaleString(),
            message: 'Thank you for your order!' ,
        },
    })

    const sendEmail = async (toEmail) => {
        const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildPayload(toEmail)),
        })

        if (!res.ok) {
            const text = await res.text()
            throw new Error(`EmailJS error for ${toEmail}: ${text}`)
        }
    }

    try {
        // Send to customer
        if (customer.email) {
            await sendEmail(customer.email)
        }
    } catch (err) {
        console.log('Customer email error:', err.message)
    }

    try {
        // Send CC to admin
        await sendEmail(ORDER_NOTIFICATION_EMAIL)
    } catch (err) {
        console.log('Admin CC email error:', err.message)
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const phoneDigits = normalizePkPhoneDigits(searchParams.get('phone') || '')
        if (phoneDigits.length !== 10) {
            return Response.json({ exists: false, error: 'Valid 10-digit phone required' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )

        const phoneVariants = buildPhoneVariants(phoneDigits)

        const [phoneOrderRes, whatsappOrderRes, rewardsRes] = await Promise.all([
            supabase
                .from('orders')
                .select('customer_name, customer_email, customer_phone, customer_whatsapp, customer_city, customer_address, created_at')
                .in('customer_phone', phoneVariants)
                .order('created_at', { ascending: false })
                .limit(1),
            supabase
                .from('orders')
                .select('customer_name, customer_email, customer_phone, customer_whatsapp, customer_city, customer_address, created_at')
                .in('customer_whatsapp', phoneVariants)
                .order('created_at', { ascending: false })
                .limit(1),
            supabase
                .from('rewards')
                .select('user_id, points, phone')
                .in('phone', phoneVariants)
                .limit(1),
        ])

        const orderCandidates = []
        if (phoneOrderRes.data?.[0]) orderCandidates.push(phoneOrderRes.data[0])
        if (whatsappOrderRes.data?.[0]) orderCandidates.push(whatsappOrderRes.data[0])
        orderCandidates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        const latest = orderCandidates[0]

        if (!latest && !(rewardsRes.data?.[0])) {
            return Response.json({ exists: false })
        }

        const rewardsUser = rewardsRes.data?.[0] || null

        return Response.json({
            exists: true,
            customer: latest ? {
                name: latest.customer_name || '',
                email: latest.customer_email || '',
                phone: latest.customer_phone || '',
                whatsapp: latest.customer_whatsapp || '',
                city: latest.customer_city || '',
                address: latest.customer_address || '',
            } : null,
            rewards: rewardsUser ? {
                user_id: rewardsUser.user_id,
                points: Number(rewardsUser.points || 0),
                phone: rewardsUser.phone || '',
            } : null,
        }, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
        return Response.json({ exists: false, error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const { cartItems, customer } = await request.json()

        const explicitRewardsUserId = (customer?.rewards?.userId || '').toLowerCase().trim()
        const inferredRewardsUserId = (customer?.email || '').includes('@')
            ? customer.email.split('@')[0].toLowerCase().trim()
            : ''
        let rewardsUserId = explicitRewardsUserId || inferredRewardsUserId

        const subtotalFromItems = (cartItems || []).reduce((s, i) => s + (parseFloat(i.price || 0) * (i.quantity || 1)), 0)
        const subtotalFromCustomer = Math.max(0, toNumber(customer?.order_subtotal || 0))
        const subtotal = subtotalFromCustomer > 0 ? subtotalFromCustomer : subtotalFromItems
        const shipping = Math.max(0, toNumber(customer?.order_shipping || 250))
        const promoDiscount = Math.max(0, toNumber(customer?.discount || 0))
        const redeemRequested = Math.max(0, toNumber(customer?.rewards?.redeem || 0))

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )

        let rewardsSummary = null
        let redeemedPoints = 0

        if (rewardsUserId) {
            const { data: rewardsUser, error: rewardsFetchError } = await supabase
                .from('rewards')
                .select('*')
                .eq('user_id', rewardsUserId)
                .single()

            if (rewardsFetchError || !rewardsUser) {
                if (explicitRewardsUserId) {
                    return Response.json({ success: false, error: 'Rewards account not found' }, { status: 400 })
                }
                rewardsUserId = ''
            } else {

                const currentPoints = Math.max(0, toNumber(rewardsUser.points))
                redeemedPoints = redeemRequested > 0 ? currentPoints : 0

                const payableAfterDiscount = Math.max(0, subtotal + shipping - promoDiscount - redeemedPoints)
                const earnedPoints = Math.floor(payableAfterDiscount / 1000) * POINTS_PER_1000
                const pointsAfterRedeem = redeemRequested > 0 ? 0 : currentPoints
                const pointsBeforeBonus = pointsAfterRedeem + earnedPoints
                const bonusAwarded = pointsBeforeBonus >= BONUS_THRESHOLD && !rewardsUser.bonus_notified
                const finalPoints = pointsBeforeBonus + (bonusAwarded ? BONUS_POINTS : 0)
                const totalSpent = Math.max(0, toNumber(rewardsUser.total_spent) + payableAfterDiscount)

                const { error: rewardsUpdateError } = await supabase
                    .from('rewards')
                    .update({
                        points: finalPoints,
                        total_spent: totalSpent,
                        bonus_notified: bonusAwarded ? true : !!rewardsUser.bonus_notified,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', rewardsUserId)

                if (rewardsUpdateError) {
                    return Response.json({ success: false, error: rewardsUpdateError.message }, { status: 500 })
                }

                rewardsSummary = {
                    userId: rewardsUserId,
                    redeemedPoints,
                    earnedPoints,
                    availablePoints: finalPoints,
                    bonusAwarded,
                    calculatedAt: new Date().toISOString(),
                }
            }
        }

        const discount = promoDiscount + redeemedPoints
        const total = Math.max(0, subtotal + shipping - discount)
        const notesText = [
            customer?.notes || '',
            rewardsSummary
                ? ('[Rewards] ' + rewardsSummary.userId + ' redeemed ' + rewardsSummary.redeemedPoints + ' pts, earned ' + rewardsSummary.earnedPoints + ' pts, balance ' + rewardsSummary.availablePoints + ' pts')
                : '',
        ].filter(Boolean).join(' | ')

        const { data: savedOrder, error } = await supabase
            .from('orders')
            .insert([{
                customer_name:     customer.name,
                customer_phone:    customer.phone,
                customer_whatsapp: customer.whatsapp || customer.phone,
                customer_email:    customer.email || '',
                customer_city:     customer.city,
                customer_address:  customer.address,
                items:             cartItems,
                subtotal,
                shipping,
                discount,
                total,
                status:            'pending',
                notes:             notesText,
            }])
            .select()
            .single()

        if (error) {
            console.log('Order save error:', error)
            return Response.json({ success: false, error: 'Failed to save order' }, { status: 500 })
        }

        // Generate order number using real ID
        const orderNumber = 'KT' + (100 + savedOrder.id)
        await supabase
            .from('orders')
            .update({ order_number: orderNumber })
            .eq('id', savedOrder.id)

        try {
            await sendOrderNotification({
                orderNumber,
                customer,
                cartItems,
                subtotal,
                shipping,
                discount,
                total,
            })
        } catch (emailErr) {
            console.log('Order email error:', emailErr)
        }

        return Response.json({
            success:     true,
            orderId:     savedOrder.id,
            orderName:   orderNumber,
            orderNumber: orderNumber,
            total,
            rewards: rewardsSummary,
        })

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}