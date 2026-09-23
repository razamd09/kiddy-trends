import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

function normalizePhone(value) {
    const raw = String(value || '').trim()
    if (!raw) return ''
    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('92')) return '+' + digits
    if (digits.startsWith('0')) return '+92' + digits.slice(1)
    if (digits.length === 10) return '+92' + digits
    return '+' + digits
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const phone = normalizePhone(searchParams.get('phone'))

        if (!phone) {
            return Response.json({ success: false, error: 'Please enter a valid phone number' }, { status: 400 })
        }

        // Two separate .eq() queries instead of a single .or() filter string —
        // a raw .or('customer_phone.eq.+923...') mangles the "+" in phone
        // numbers and silently matches nothing (bit us before in the rewards
        // lookup/history routes).
        const selectCols = 'id, order_number, customer_name, customer_city, customer_address, items, subtotal, shipping, discount, total, status, payment_method, payment_verified, created_at'
        const [byPhone, byWhatsapp] = await Promise.all([
            supabase.from('orders').select(selectCols).eq('customer_phone', phone),
            supabase.from('orders').select(selectCols).eq('customer_whatsapp', phone),
        ])

        if (byPhone.error) return Response.json({ success: false, error: byPhone.error.message }, { status: 500 })
        if (byWhatsapp.error) return Response.json({ success: false, error: byWhatsapp.error.message }, { status: 500 })

        const byId = new Map()
        ;[...(byPhone.data || []), ...(byWhatsapp.data || [])].forEach((order) => byId.set(order.id, order))
        const orders = [...byId.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        return Response.json({ success: true, orders })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
