import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

function normalizeCampaignNumber(value) {
    const parsed = Number(value)
    return [1, 2, 3].includes(parsed) ? parsed : null
}

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const campaignNumber = normalizeCampaignNumber(searchParams.get('campaign'))
    if (!campaignNumber) {
        return Response.json({ success: false, error: 'campaign must be 1, 2, or 3' }, { status: 400 })
    }

    const { data: slots, error: slotsError } = await supabase
        .from('campaign_slots')
        .select('id, product_id, position')
        .eq('campaign_number', campaignNumber)
        .order('position', { ascending: true })

    if (slotsError) return Response.json({ success: false, error: slotsError.message }, { status: 500 })
    if (!slots || slots.length === 0) return Response.json({ success: true, items: [] })

    const productIds = slots.map((s) => s.product_id)
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, title, images, price, is_active')
        .in('id', productIds)

    if (productsError) return Response.json({ success: false, error: productsError.message }, { status: 500 })

    const productById = new Map((products || []).map((p) => [p.id, p]))
    const items = slots
        .map((slot) => {
            const product = productById.get(slot.product_id)
            if (!product) return null
            const images = Array.isArray(product.images) ? product.images : []
            return {
                slotId: slot.id,
                productId: product.id,
                title: product.title,
                image: images[0] || null,
                price: product.price,
                isActive: product.is_active !== false,
            }
        })
        .filter(Boolean)

    return Response.json({ success: true, items })
}

export async function POST(request) {
    try {
        const body = await request.json()
        const campaignNumber = normalizeCampaignNumber(body.campaign_number)
        const productId = Number(body.product_id)
        if (!campaignNumber) return Response.json({ success: false, error: 'campaign_number must be 1, 2, or 3' }, { status: 400 })
        if (!Number.isFinite(productId)) return Response.json({ success: false, error: 'product_id is required' }, { status: 400 })

        const { data: existing } = await supabase
            .from('campaign_slots')
            .select('id')
            .eq('campaign_number', campaignNumber)
            .eq('product_id', productId)
            .maybeSingle()
        if (existing) return Response.json({ success: false, error: 'That product is already pinned to this campaign' }, { status: 409 })

        const { data: maxRow } = await supabase
            .from('campaign_slots')
            .select('position')
            .eq('campaign_number', campaignNumber)
            .order('position', { ascending: false })
            .limit(1)
            .maybeSingle()
        const nextPosition = (maxRow?.position ?? -1) + 1

        const { error } = await supabase
            .from('campaign_slots')
            .insert([{ campaign_number: campaignNumber, product_id: productId, position: nextPosition }])

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
        return Response.json({ success: true })
    } catch (err) {
        return Response.json({ success: false, error: err.message || 'Invalid request' }, { status: 400 })
    }
}

// Bulk reorder: replaces the full position order for one campaign in one call,
// since drag-and-drop naturally produces a full reordered list, not a single move.
export async function PUT(request) {
    try {
        const body = await request.json()
        const campaignNumber = normalizeCampaignNumber(body.campaign_number)
        const productIds = Array.isArray(body.product_ids) ? body.product_ids.map(Number) : null
        if (!campaignNumber) return Response.json({ success: false, error: 'campaign_number must be 1, 2, or 3' }, { status: 400 })
        if (!productIds) return Response.json({ success: false, error: 'product_ids array is required' }, { status: 400 })

        await Promise.all(
            productIds.map((productId, index) =>
                supabase
                    .from('campaign_slots')
                    .update({ position: index })
                    .eq('campaign_number', campaignNumber)
                    .eq('product_id', productId)
            )
        )

        return Response.json({ success: true })
    } catch (err) {
        return Response.json({ success: false, error: err.message || 'Invalid request' }, { status: 400 })
    }
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url)
    const campaignNumber = normalizeCampaignNumber(searchParams.get('campaign'))
    const productId = Number(searchParams.get('product_id'))
    if (!campaignNumber) return Response.json({ success: false, error: 'campaign must be 1, 2, or 3' }, { status: 400 })
    if (!Number.isFinite(productId)) return Response.json({ success: false, error: 'product_id is required' }, { status: 400 })

    const { error } = await supabase
        .from('campaign_slots')
        .delete()
        .eq('campaign_number', campaignNumber)
        .eq('product_id', productId)

    if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
    return Response.json({ success: true })
}
