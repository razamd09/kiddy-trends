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

const RESTOCK_MARKER = '[Stock restored]'

function parseOrderItems(raw) {
    try {
        return typeof raw === 'string' ? JSON.parse(raw) : (raw || [])
    } catch {
        return []
    }
}

// Return each cancelled item's quantity back to stock.
// An order item's variantId is "<productDbId>_<variantIndex>", so we recover the
// product row from it and bump both the aggregate `stock` and, for real-variant
// products, the matching variant's `inventory_qty`.
async function restockOrderItems(items) {
    const byProduct = new Map() // productId -> { total, variants: Map(index -> qty) }

    for (const item of items) {
        const qty = Math.max(0, Number(item?.quantity) || 0)
        if (!qty) continue
        const variantId = String(item?.variantId || '')
        const match = variantId.match(/^(.*)_(\d+)$/)
        if (!match) continue // can't reliably map to a product row — skip rather than guess
        const productId = match[1]
        const variantIndex = Number(match[2])
        if (!productId) continue

        if (!byProduct.has(productId)) byProduct.set(productId, { total: 0, variants: new Map() })
        const entry = byProduct.get(productId)
        entry.total += qty
        entry.variants.set(variantIndex, (entry.variants.get(variantIndex) || 0) + qty)
    }

    for (const [productId, info] of byProduct) {
        const { data: product, error } = await supabase
            .from('products')
            .select('id, stock, variants')
            .eq('id', productId)
            .single()
        if (error || !product) continue

        const newStock = (Number(product.stock) || 0) + info.total
        let newVariants = product.variants
        if (Array.isArray(product.variants) && info.variants.size > 0) {
            newVariants = product.variants.map((v, idx) => {
                const add = info.variants.get(idx)
                if (!add) return v
                return { ...v, inventory_qty: (Number(v?.inventory_qty) || 0) + add }
            })
        }

        await supabase
            .from('products')
            .update({ stock: newStock, variants: newVariants })
            .eq('id', productId)
    }
}

export async function PUT(request) {
    const { id, status, notes } = await request.json()

    if (!id || (status === undefined && notes === undefined)) {
        return Response.json({ error: 'Order id and at least one field are required' }, { status: 400 })
    }

    // Load the current order so we can detect a real cancellation transition and
    // read the items to restock.
    const { data: current, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !current) {
        return Response.json({ error: fetchError?.message || 'Order not found' }, { status: 404 })
    }

    const updates = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (typeof notes === 'string') updates.notes = notes

    // Restock only when an order actually transitions INTO cancelled, and only once
    // (guarded by both the status transition and a notes marker) so repeated saves
    // or cancel/uncancel/cancel cycles never inflate stock.
    const isCancelling = status === 'cancelled' && current.status !== 'cancelled'
    const alreadyRestored = String(current.notes || '').includes(RESTOCK_MARKER)
    if (isCancelling && !alreadyRestored) {
        try {
            await restockOrderItems(parseOrderItems(current.items))
            const baseNotes = (typeof notes === 'string' ? notes : current.notes) || ''
            updates.notes = (String(baseNotes).trim() + ' ' + RESTOCK_MARKER).trim()
        } catch (restockError) {
            console.log('Restock error on cancel:', restockError)
            // Fall through: still cancel the order even if restock hit an issue.
        }
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