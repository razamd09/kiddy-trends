import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

function normalizeName(value) {
    return String(value || '').trim()
}

function normalizeSortOrder(value) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.trunc(parsed) : 0
}

export async function GET() {
    const { data, error } = await supabase
        .from('product_types')
        .select('id, name, is_active, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ types: data || [] })
}

export async function POST(request) {
    try {
        const body = await request.json()
        const name = normalizeName(body.name)
        const sortOrder = normalizeSortOrder(body.sort_order)

        if (!name) {
            return Response.json({ error: 'Name is required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('product_types')
            .insert([{ name, sort_order: sortOrder, is_active: body.is_active !== false }])
            .select('id, name, is_active, sort_order')
            .single()

        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, type: data }, { status: 201 })
    } catch (err) {
        return Response.json({ error: err.message || 'Invalid request' }, { status: 400 })
    }
}

export async function PUT(request) {
    try {
        const body = await request.json()
        const id = String(body.id || '').trim()

        if (!id) {
            return Response.json({ error: 'ID is required' }, { status: 400 })
        }

        const updates = {
            updated_at: new Date().toISOString(),
        }

        if (body.name !== undefined) {
            const name = normalizeName(body.name)
            if (!name) return Response.json({ error: 'Name cannot be empty' }, { status: 400 })
            updates.name = name
        }

        if (body.sort_order !== undefined) {
            updates.sort_order = normalizeSortOrder(body.sort_order)
        }

        if (body.is_active !== undefined) {
            updates.is_active = Boolean(body.is_active)
        }

        const { data, error } = await supabase
            .from('product_types')
            .update(updates)
            .eq('id', id)
            .select('id, name, is_active, sort_order')
            .single()

        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, type: data })
    } catch (err) {
        return Response.json({ error: err.message || 'Invalid request' }, { status: 400 })
    }
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url)
    const id = String(searchParams.get('id') || '').trim()

    if (!id) {
        return Response.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
        .from('product_types')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
}
