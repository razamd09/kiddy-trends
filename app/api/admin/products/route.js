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

    const { data, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ products: data, total: count })
}

export async function POST(request) {
    const body = await request.json()

    const { data, error } = await supabase
        .from('products')
        .insert([{
            title:         body.title,
            description:   body.description,
            price:         body.price,
            compare_price: body.compare_price,
            images:        body.images || [],
            category:      body.category,
            product_type:  body.product_type,
            tags:          body.tags || [],
            stock:         body.stock || 0,
            is_active:     true,
            source:        'custom',
        }])
        .select()
        .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, product: data })
}

export async function PUT(request) {
    const body = await request.json()
    const { id, ...updates } = body

    const { data, error } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, product: data })
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
}