import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
const DRAFT_SOURCE = 'draft_workspace'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = 20
        const offset = (Math.max(page, 1) - 1) * limit

        const { data, error, count } = await supabase
            .from('products')
            .select('id, title, category, price, compare_price, stock, is_active, product_type, images, created_at', { count: 'exact' })
            .or('source.is.null,source.neq.' + DRAFT_SOURCE)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, products: data || [], total: count || 0 })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const body = await request.json()
        const { id, stock, price, compare_price, is_active } = body || {}
        if (!id) return Response.json({ error: 'id required' }, { status: 400 })

        const updates = { updated_at: new Date().toISOString() }
        if (stock !== undefined) updates.stock = parseInt(stock, 10) || 0
        if (price !== undefined) updates.price = parseFloat(price) || 0
        if (compare_price !== undefined) updates.compare_price = compare_price ? parseFloat(compare_price) : null
        if (is_active !== undefined) updates.is_active = !!is_active

        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, product: data })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}
