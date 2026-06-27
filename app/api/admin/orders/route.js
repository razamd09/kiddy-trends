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
    const status = searchParams.get('status')

    let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
        query = query.eq('status', status)
    }

    const { data, error, count } = await query
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ orders: data, total: count })
}

export async function PUT(request) {
    const { id, status, notes } = await request.json()
    const updates = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (typeof notes === 'string') updates.notes = notes

    if (!id || (status === undefined && notes === undefined)) {
        return Response.json({ error: 'Order id and at least one field are required' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, order: data })
}