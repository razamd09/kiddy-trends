import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const DRAFT_SOURCE = 'draft_workspace'

function normalizeVariantText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/years?/g, 'y')
        .replace(/[^a-z0-9]/g, '')
}

function parseVariants(rawVariants) {
    if (Array.isArray(rawVariants)) return rawVariants
    if (typeof rawVariants === 'string') {
        try {
            const parsed = JSON.parse(rawVariants)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }
    return []
}

function productMatchesVariant(rawVariants, variantFilter) {
    const needle = normalizeVariantText(variantFilter)
    if (!needle) return true

    const variants = parseVariants(rawVariants)
    if (variants.length === 0) return false

    return variants.some((variant) => {
        const values = [
            variant?.option1_value,
            variant?.option2_value,
            variant?.option3_value,
            variant?.title,
            variant?.name,
            variant?.size,
        ]
        return values.some((value) => {
            const normalized = normalizeVariantText(value)
            return normalized && (normalized.includes(needle) || needle.includes(normalized))
        })
    })
}

function normalizeImages(images) {
    if (Array.isArray(images)) {
        return images.map((img) => (typeof img === 'string' ? img : img?.src)).filter(Boolean)
    }
    if (typeof images === 'string') {
        const trimmed = images.trim()
        if (!trimmed) return []
        try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) {
                return parsed.map((img) => (typeof img === 'string' ? img : img?.src)).filter(Boolean)
            }
        } catch {}
        if (trimmed.includes('\n')) return trimmed.split('\n').map((s) => s.trim()).filter(Boolean)
        return [trimmed]
    }
    return []
}

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100)
    const offset = (page - 1) * limit
    const category = (searchParams.get('category') || '').trim()
    const search = (searchParams.get('search') || '').trim()
    const variant = (searchParams.get('variant') || '').trim()
    const sortByRaw = (searchParams.get('sortBy') || 'updated_at').trim()
    const sortDirRaw = (searchParams.get('sortDir') || 'desc').trim().toLowerCase()
    const sortByAllowed = ['created_at', 'updated_at', 'price', 'title', 'stock']
    const sortBy = sortByAllowed.includes(sortByRaw) ? sortByRaw : 'updated_at'
    const ascending = sortDirRaw === 'asc'

    let data = []
    let error = null
    let count = 0

    if (variant) {
        let variantQuery = supabase.from('products').select('*').eq('source', DRAFT_SOURCE)
        if (category && category !== 'all') variantQuery = variantQuery.eq('category', category)
        if (search) variantQuery = variantQuery.ilike('title', '%' + search + '%')
        variantQuery = variantQuery.order(sortBy, { ascending })
        let variantResult = await variantQuery

        if (variantResult.error && /(created_at|updated_at)/i.test(variantResult.error.message || '')) {
            let fallbackVariantQuery = supabase.from('products').select('*').eq('source', DRAFT_SOURCE)
            if (category && category !== 'all') fallbackVariantQuery = fallbackVariantQuery.eq('category', category)
            if (search) fallbackVariantQuery = fallbackVariantQuery.ilike('title', '%' + search + '%')
            variantResult = await fallbackVariantQuery.order('id', { ascending: false })
        }

        if (variantResult.error) {
            error = variantResult.error
        } else {
            const variantFiltered = (variantResult.data || []).filter((product) =>
                productMatchesVariant(product.variants, variant)
            )
            count = variantFiltered.length
            data = variantFiltered.slice(offset, offset + limit)
        }
    } else {
        let query = supabase.from('products').select('*', { count: 'exact' }).eq('source', DRAFT_SOURCE)
        if (category && category !== 'all') query = query.eq('category', category)
        if (search) query = query.ilike('title', '%' + search + '%')
        query = query.order(sortBy, { ascending }).range(offset, offset + limit - 1)
        const result = await query
        data = result.data
        error = result.error
        count = result.count
    }

    if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

    const products = (data || []).map((product) => ({
        ...product,
        images: normalizeImages(product.images),
    }))
    return Response.json({ success: true, products, total: count || 0 })
}

export async function POST(request) {
    try {
        const body = await request.json()

        const { data, error } = await supabase
            .from('products')
            .insert([{
                title: String(body.title || '').trim(),
                description: String(body.description || '').trim(),
                price: parseFloat(body.price) || 0,
                compare_price: body.compare_price ? parseFloat(body.compare_price) : null,
                images: Array.isArray(body.images)
                    ? body.images.map((img) => (typeof img === 'string' ? img : img?.src)).filter(Boolean)
                    : [],
                category: String(body.category || '').trim(),
                product_type: String(body.product_type || '').trim(),
                tags: Array.isArray(body.tags) ? body.tags : [],
                variants: body.variants || null,
                stock: parseInt(body.stock, 10) || 0,
                is_active: false,
                source: DRAFT_SOURCE,
                shopify_handle: body.shopify_handle || null,
            }])
            .select()
            .single()

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
        return Response.json({ success: true, product: data })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const body = await request.json()
        const { id, ...updates } = body
        if (!id) return Response.json({ success: false, error: 'Product ID is required' }, { status: 400 })

        const cleanUpdates = { ...updates, updated_at: new Date().toISOString() }
        if (updates.title !== undefined) cleanUpdates.title = String(updates.title || '').trim()
        if (updates.category !== undefined) cleanUpdates.category = String(updates.category || '').trim()
        if (updates.description !== undefined) cleanUpdates.description = String(updates.description || '').trim()
        if (updates.product_type !== undefined) cleanUpdates.product_type = String(updates.product_type || '').trim()
        if (updates.images) cleanUpdates.images = Array.isArray(updates.images) ? updates.images.map((img) => (typeof img === 'string' ? img : img?.src)).filter(Boolean) : []
        if (updates.tags) cleanUpdates.tags = Array.isArray(updates.tags) ? updates.tags : []
        if (updates.price !== undefined) cleanUpdates.price = parseFloat(updates.price) || 0
        if (updates.compare_price !== undefined) cleanUpdates.compare_price = updates.compare_price ? parseFloat(updates.compare_price) : null
        if (updates.stock !== undefined) cleanUpdates.stock = parseInt(updates.stock, 10) || 0

        const { data, error } = await supabase
            .from('products')
            .update(cleanUpdates)
            .eq('id', id)
            .eq('source', DRAFT_SOURCE)
            .select()
            .single()

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
        return Response.json({ success: true, product: data })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return Response.json({ success: false, error: 'Product ID required' }, { status: 400 })

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .eq('source', DRAFT_SOURCE)

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
        return Response.json({ success: true })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}

