import { createClient } from '@supabase/supabase-js'

const ORDER_NOTIFICATION_EMAIL = process.env.ORDER_NOTIFICATION_EMAIL || 'thekiddytrends@gmail.com'
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'service_9p08wct'
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || 'template_gyanmsp'
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'G3OmrUP2PwOat-o1W'

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

    const payload = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
            to_email: ORDER_NOTIFICATION_EMAIL,
            customer_name: customer.name || 'N/A',
            customer_email: customer.email || ORDER_NOTIFICATION_EMAIL,
            phone: customer.phone || '',
            address: customer.address || '',
            city: customer.city || '',
            order_number: orderNumber,
            order_items: orderItemsText,
            subtotal: 'PKR ' + Number(subtotal || 0).toLocaleString(),
            shipping: 'PKR ' + Number(shipping || 0).toLocaleString(),
            discount: 'PKR ' + Number(discount || 0).toLocaleString(),
            total: 'PKR ' + Number(total || 0).toLocaleString(),
            message: 'We have received an order from website.',
        },
    }

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error('EmailJS error: ' + text)
    }
}

export async function POST(request) {
    try {
        const { cartItems, customer } = await request.json()

        const subtotal = cartItems.reduce((s, i) => s + (parseFloat(i.price || 0) * i.quantity), 0)
        const shipping = 250
        const discount = customer.discount || 0
        const total    = subtotal + shipping - discount

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )

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
                notes:             customer.notes || '',
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
        })

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}