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
            return Response.json({ success: false, error: 'Phone is required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('wishlist_items')
            .select('product_id, product_snapshot, created_at')
            .eq('phone', phone)
            .order('created_at', { ascending: false })

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

        const products = (data || []).map((row) => row.product_snapshot)
        return Response.json({ success: true, products })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}))
        const phone = normalizePhone(body?.phone)
        const products = Array.isArray(body?.products) ? body.products : (body?.product ? [body.product] : [])

        if (!phone) return Response.json({ success: false, error: 'Phone is required' }, { status: 400 })
        if (products.length === 0) return Response.json({ success: false, error: 'No products provided' }, { status: 400 })

        const rows = products
            .map((product) => {
                const productId = String(product?._id ?? product?.id ?? '').trim()
                if (!productId) return null
                return { phone, product_id: productId, product_snapshot: product }
            })
            .filter(Boolean)

        if (rows.length === 0) return Response.json({ success: false, error: 'No valid products provided' }, { status: 400 })

        const { error } = await supabase
            .from('wishlist_items')
            .upsert(rows, { onConflict: 'phone,product_id' })

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const phone = normalizePhone(searchParams.get('phone'))
        const productId = String(searchParams.get('productId') || '').trim()

        if (!phone) return Response.json({ success: false, error: 'Phone is required' }, { status: 400 })
        if (!productId) return Response.json({ success: false, error: 'productId is required' }, { status: 400 })

        const { error } = await supabase
            .from('wishlist_items')
            .delete()
            .eq('phone', phone)
            .eq('product_id', productId)

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
