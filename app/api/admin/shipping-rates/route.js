import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

function toNumber(value) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : NaN
}

async function deactivateOtherRates(excludeId = null) {
    let query = supabase
        .from('shipping_rates')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('is_active', true)

    if (excludeId) query = query.neq('id', excludeId)

    const { error } = await query
    if (error) throw error
}

export async function GET() {
    const { data, error } = await supabase
        .from('shipping_rates')
        .select('*')
        .order('updated_at', { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ rates: data || [] })
}

export async function POST(request) {
    try {
        const body = await request.json()
        const name = String(body.name || '').trim()
        const flatPrice = toNumber(body.flat_price)
        const shippingPercentage = toNumber(body.shipping_percentage)
        const isActive = body.is_active !== false

        if (!name) {
            return Response.json({ error: 'Name is required' }, { status: 400 })
        }
        if (!Number.isFinite(flatPrice) || flatPrice < 0) {
            return Response.json({ error: 'flat_price must be a non-negative number' }, { status: 400 })
        }
        if (!Number.isFinite(shippingPercentage) || shippingPercentage < 0) {
            return Response.json({ error: 'shipping_percentage must be a non-negative number' }, { status: 400 })
        }

        if (isActive) {
            await deactivateOtherRates()
        }

        const { data, error } = await supabase
            .from('shipping_rates')
            .insert([{
                name,
                flat_price: flatPrice,
                shipping_percentage: shippingPercentage,
                is_active: isActive,
            }])
            .select()
            .single()

        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, rate: data }, { status: 201 })
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

        const updates = { updated_at: new Date().toISOString() }

        if (body.name !== undefined) {
            const name = String(body.name || '').trim()
            if (!name) return Response.json({ error: 'Name cannot be empty' }, { status: 400 })
            updates.name = name
        }

        if (body.flat_price !== undefined) {
            const flatPrice = toNumber(body.flat_price)
            if (!Number.isFinite(flatPrice) || flatPrice < 0) {
                return Response.json({ error: 'flat_price must be a non-negative number' }, { status: 400 })
            }
            updates.flat_price = flatPrice
        }

        if (body.shipping_percentage !== undefined) {
            const shippingPercentage = toNumber(body.shipping_percentage)
            if (!Number.isFinite(shippingPercentage) || shippingPercentage < 0) {
                return Response.json({ error: 'shipping_percentage must be a non-negative number' }, { status: 400 })
            }
            updates.shipping_percentage = shippingPercentage
        }

        if (body.is_active !== undefined) {
            updates.is_active = Boolean(body.is_active)
            if (updates.is_active) {
                await deactivateOtherRates(id)
            }
        }

        const { data, error } = await supabase
            .from('shipping_rates')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, rate: data })
    } catch (err) {
        return Response.json({ error: err.message || 'Invalid request' }, { status: 400 })
    }
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return Response.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
        .from('shipping_rates')
        .delete()
        .eq('id', id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
}
