import { createClient } from '@supabase/supabase-js'
import { applyOrderStatusUpdate } from '../../admin/orders/route'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const AUTO_DELIVER_AFTER_DAYS = 3

// Runs daily via Vercel Cron (see vercel.json). Any order still sitting in
// "dispatched" 3+ days after dispatched_at was recorded gets auto-advanced
// to "delivered" through the same shared update function a manual status
// change uses, so the review-request email and customer WhatsApp update
// still fire exactly as they would for a manual change.
export async function GET(request) {
    const authHeader = request.headers.get('authorization')
    if (!process.env.CRON_SECRET || authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cutoff = new Date(Date.now() - AUTO_DELIVER_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const { data: due, error } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'dispatched')
        .not('dispatched_at', 'is', null)
        .lte('dispatched_at', cutoff)

    if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

    const results = []
    for (const order of due || []) {
        const result = await applyOrderStatusUpdate(order.id, { status: 'delivered' })
        results.push({ id: order.id, success: !result.error, error: result.error })
    }

    return Response.json({ success: true, processed: results.length, results })
}
