import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
    try {
        const { cartItems, customer } = await request.json()

        // Calculate totals
        const subtotal = cartItems.reduce((s, i) => s + (parseFloat(i.price || 0) * i.quantity), 0)
        const shipping  = 250
        const discount  = customer.discount || 0
        const total     = subtotal + shipping - discount

        // Save directly to Supabase — no Shopify needed
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
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

        return Response.json({
            success:   true,
            orderId:   savedOrder.id,
            orderName: '#KT-' + savedOrder.id,
        })

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}