import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const page   = parseInt(searchParams.get('page') || '1')
    const limit  = 20
    const offset = (page - 1) * limit

    let { data, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    // Some older tables may not have created_at; fallback to id ordering.
    if (error && /created_at/i.test(error.message || '')) {
        const fallback = await supabase
            .from('products')
            .select('*', { count: 'exact' })
            .order('id', { ascending: false })
            .range(offset, offset + limit - 1)
        data = fallback.data
        error = fallback.error
        count = fallback.count
    }

    if (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
    return Response.json({ success: true, products: data || [], total: count || 0 })
}

export async function POST(request) {
    try {
        const body = await request.json()

        const { data, error } = await supabase
            .from('products')
            .insert([{
                title:         body.title,
                description:   body.description,
                price:         parseFloat(body.price) || 0,
                compare_price: body.compare_price ? parseFloat(body.compare_price) : null,
                images:        Array.isArray(body.images) 
                    ? body.images.map(img => typeof img === 'string' ? img : img.src)
                    : (body.images || []),
                category:      body.category,
                product_type:  body.product_type,
                tags:          Array.isArray(body.tags) ? body.tags : (body.tags || []),
                variants:      body.variants || null,
                stock:         parseInt(body.stock) || 0,
                is_active:     true,
                source:        'custom',
                shopify_handle: body.shopify_handle || null,
            }])
            .select()
            .single()

        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, product: data })
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const body = await request.json()
        const { id, ...updates } = body

        const cleanUpdates = {
            ...updates,
            updated_at: new Date().toISOString()
        }

        if (updates.images) {
            cleanUpdates.images = Array.isArray(updates.images)
                ? updates.images.map(img => typeof img === 'string' ? img : img.src)
                : []
        }

        if (updates.tags) {
            cleanUpdates.tags = Array.isArray(updates.tags) ? updates.tags : []
        }

        if (updates.price) {
            cleanUpdates.price = parseFloat(updates.price)
        }

        if (updates.compare_price) {
            cleanUpdates.compare_price = parseFloat(updates.compare_price)
        }

        if (updates.stock) {
            cleanUpdates.stock = parseInt(updates.stock)
        }

        const { data, error } = await supabase
            .from('products')
            .update(cleanUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, product: data })
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return Response.json({ error: 'Product ID required' }, { status: 400 })

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true })
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 })
    }
}