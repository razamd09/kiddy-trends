import { createClient } from '@supabase/supabase-js'
import { cancelOrder } from '../../../../../lib/postexApi'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function POST(request) {
    try {
        const { orderId, trackingNumber } = await request.json()
        if (!orderId || !trackingNumber) {
            return Response.json({ success: false, error: 'orderId and trackingNumber are required' }, { status: 400 })
        }

        const result = await cancelOrder(trackingNumber)
        if (!result.success) {
            return Response.json({ success: false, error: result.error }, { status: 502 })
        }

        const { error } = await supabase
            .from('instagram_orders')
            .update({ order_status: 'Cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', orderId)

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
        return Response.json({ success: true })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
