import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function GET() {
    const [ordersRes, productsRes, customersRes, revenueRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('rewards').select('id', { count: 'exact' }),
        supabase.from('orders').select('total').eq('status', 'delivered'),
    ])

    const totalRevenue = revenueRes.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0

    const todayStart = new Date()
    todayStart.setHours(0,0,0,0)

    const { data: todayOrders } = await supabase
        .from('orders')
        .select('id, total')
        .gte('created_at', todayStart.toISOString())

    const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')

    return Response.json({
        totalOrders:    ordersRes.count || 0,
        totalProducts:  productsRes.count || 0,
        totalCustomers: customersRes.count || 0,
        totalRevenue,
        todayOrders:    todayOrders?.length || 0,
        todayRevenue:   todayOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0,
        pendingOrders:  pendingOrders?.length || 0,
    })
}