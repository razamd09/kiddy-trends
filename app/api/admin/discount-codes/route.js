import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
        .from('discount_codes')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ codes: data, total: count })
}

export async function POST(request) {
    const { code, discount_type, discount_value, enabled, expiry_type, expiry_date, max_usage } = await request.json()

    if (!code || !discount_type || discount_value === undefined || !expiry_type) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['percentage', 'amount'].includes(discount_type)) {
        return Response.json({ error: 'Invalid discount_type' }, { status: 400 })
    }

    if (!['unlimited', 'limited'].includes(expiry_type)) {
        return Response.json({ error: 'Invalid expiry_type' }, { status: 400 })
    }

    if (expiry_type === 'limited' && !expiry_date) {
        return Response.json({ error: 'expiry_date required for limited expiry' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('discount_codes')
        .insert([{
            code: code.toUpperCase(),
            discount_type,
            discount_value: parseFloat(discount_value),
            enabled: enabled || false,
            expiry_type,
            expiry_date: expiry_type === 'limited' ? expiry_date : null,
            max_usage: max_usage || null
        }])
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            return Response.json({ error: 'Code already exists' }, { status: 400 })
        }
        return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, code: data }, { status: 201 })
}

export async function PUT(request) {
    const { id, code, discount_type, discount_value, enabled, expiry_type, expiry_date, max_usage } = await request.json()

    if (!id) {
        return Response.json({ error: 'ID is required' }, { status: 400 })
    }

    const updates = { updated_at: new Date().toISOString() }
    if (code) updates.code = code.toUpperCase()
    if (discount_type) updates.discount_type = discount_type
    if (discount_value !== undefined) updates.discount_value = parseFloat(discount_value)
    if (enabled !== undefined) updates.enabled = enabled
    if (expiry_type) updates.expiry_type = expiry_type
    if (expiry_date !== undefined) updates.expiry_date = expiry_date
    if (max_usage !== undefined) updates.max_usage = max_usage

    const { data, error } = await supabase
        .from('discount_codes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            return Response.json({ error: 'Code already exists' }, { status: 400 })
        }
        return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, code: data })
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return Response.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
}
