import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('order_number')?.toUpperCase().trim()

    if (!orderNumber) {
        return Response.json({ error: 'Order number is required' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_city, status, items, subtotal, shipping, total, created_at, updated_at')
        .eq('order_number', orderNumber)
        .single()

    if (error || !data) {
        return Response.json({ error: 'Order not found. Please check your order number.' }, { status: 404 })
    }

    return Response.json({ success: true, order: data })
}