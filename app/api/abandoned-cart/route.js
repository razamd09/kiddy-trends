import { createClient } from '@supabase/supabase-js'
import { sendEmailWithEmailJs } from '../admin/customers/customer-data'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const NOTIFY_COOLDOWN_MS = 60 * 60 * 1000 // don't re-email the same session more than once an hour

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim().toLowerCase())
}

function buildCartSummary(cartItems) {
    return (Array.isArray(cartItems) ? cartItems : [])
        .map((item) => {
            const title = String(item?.title || 'Item').trim()
            const qty = Number(item?.quantity || 1)
            return title + ' x' + qty
        })
        .join(', ')
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}))
        const email = String(body?.email || '').trim().toLowerCase()
        const sessionId = String(body?.sessionId || '').trim()
        const cartItems = Array.isArray(body?.cartItems) ? body.cartItems : []
        const totalPrice = Number(body?.totalPrice || 0)

        if (!isValidEmail(email)) {
            return Response.json({ success: false, error: 'Please enter a valid email address' }, { status: 400 })
        }
        if (!sessionId) {
            return Response.json({ success: false, error: 'Missing session' }, { status: 400 })
        }

        const { data: existing } = await supabase
            .from('abandoned_carts')
            .select('id, notified_at')
            .eq('session_id', sessionId)
            .maybeSingle()

        const shouldNotify = !existing?.notified_at
            || (Date.now() - new Date(existing.notified_at).getTime()) > NOTIFY_COOLDOWN_MS

        const { error: upsertError } = await supabase
            .from('abandoned_carts')
            .upsert([{
                session_id: sessionId,
                email,
                cart_items: cartItems,
                total_price: totalPrice,
                updated_at: new Date().toISOString(),
            }], { onConflict: 'session_id' })

        if (upsertError) {
            return Response.json({ success: false, error: upsertError.message }, { status: 500 })
        }

        let emailSent = false
        if (shouldNotify && cartItems.length > 0) {
            try {
                const summary = buildCartSummary(cartItems)
                await sendEmailWithEmailJs(
                    email,
                    'Your Kiddy Trends cart is waiting for you 🛍️',
                    'You left these items in your cart: ' + summary + '. Total: PKR ' + Math.round(totalPrice).toLocaleString('en-PK') + '. Complete your order now at thekiddytrends.com before they sell out!'
                )
                emailSent = true
                await supabase
                    .from('abandoned_carts')
                    .update({ notified_at: new Date().toISOString() })
                    .eq('session_id', sessionId)
            } catch {
                // Cart snapshot is still saved even if the email fails to send.
            }
        }

        return Response.json({ success: true, emailSent })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
