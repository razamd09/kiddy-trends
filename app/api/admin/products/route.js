import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)
const signedUrlCache = new Map()
const SIGNED_URL_TTL_MS = 29 * 24 * 60 * 60 * 1000
const SIGNED_URL_BUFFER_MS = 5 * 60 * 1000

function normalizeImages(images) {
    if (Array.isArray(images)) {
        return images
            .map(img => typeof img === 'string' ? img : img?.src)
            .filter(Boolean)
    }

    if (typeof images === 'string') {
        const trimmed = images.trim()
        if (!trimmed) return []

        try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) {
                return parsed
                    .map(img => typeof img === 'string' ? img : img?.src)
                    .filter(Boolean)
            }
        } catch {}

        if (trimmed.includes('\n')) {
            return trimmed.split('\n').map(s => s.trim()).filter(Boolean)
        }

        return [trimmed]
    }

    return []
}

function getSupabaseStoragePath(url) {
    if (typeof url !== 'string') return null

    const publicMarker = '/storage/v1/object/public/products/'
    const signedMarker = '/storage/v1/object/sign/products/'
    let path = null

    if (url.includes(publicMarker)) {
        path = url.split(publicMarker)[1]
    } else if (url.includes(signedMarker)) {
        path = url.split(signedMarker)[1]
    } else if (url.startsWith('images/')) {
        path = url
    }

    if (!path) return null
    return path.split('?')[0]
}

async function resolveSignedImageUrl(url) {
    const storagePath = getSupabaseStoragePath(url)
    if (!storagePath) return url

    const cached = signedUrlCache.get(storagePath)
    if (cached && cached.expiresAt > Date.now() + SIGNED_URL_BUFFER_MS) {
        return cached.url
    }

    const { data: signedData, error: signError } = await supabase.storage
        .from('products')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 30)

    if (signError || !signedData?.signedUrl) return url

    signedUrlCache.set(storagePath, {
        url: signedData.signedUrl,
        expiresAt: Date.now() + SIGNED_URL_TTL_MS,
    })

    return signedData.signedUrl
}

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const page   = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit  = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100)
    const offset = (page - 1) * limit
    const category = (searchParams.get('category') || '').trim()
    const search = (searchParams.get('search') || '').trim()
    const sortByRaw = (searchParams.get('sortBy') || 'created_at').trim()
    const sortDirRaw = (searchParams.get('sortDir') || 'desc').trim().toLowerCase()
    const sortByAllowed = ['created_at', 'updated_at', 'price', 'title', 'stock']
    const sortBy = sortByAllowed.includes(sortByRaw) ? sortByRaw : 'created_at'
    const ascending = sortDirRaw === 'asc'

    let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
    if (category && category !== 'all') {
        query = query.eq('category', category)
    }
    if (search) {
        query = query.ilike('title', '%' + search + '%')
    }
    query = query
        .order(sortBy, { ascending })
        .range(offset, offset + limit - 1)
    let { data, error, count } = await query

    // Some older tables may not have created_at/updated_at; fallback to id ordering.
    if (error && /(created_at|updated_at)/i.test(error.message || '')) {
        let fallback = supabase
            .from('products')
            .select('*', { count: 'exact' })
        if (category && category !== 'all') {
            fallback = fallback.eq('category', category)
        }
        if (search) {
            fallback = fallback.ilike('title', '%' + search + '%')
        }
        fallback = fallback
            .order('id', { ascending: false })
            .range(offset, offset + limit - 1)
        const fallbackResult = await fallback
        data = fallbackResult.data
        error = fallbackResult.error
        count = fallbackResult.count
    }

    if (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    const products = await Promise.all((data || []).map(async (product) => {
        const imageUrls = normalizeImages(product.images)
        const resolvedImages = await Promise.all(imageUrls.map(resolveSignedImageUrl))

        return {
            ...product,
            images: resolvedImages,
        }
    }))

    const response = Response.json({ success: true, products, total: count || 0 })
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=120')
    return response
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

        if (!id) {
            return Response.json({ success: false, error: 'Product ID is required' }, { status: 400 })
        }

        const cleanUpdates = {
            ...updates,
            updated_at: new Date().toISOString()
        }

        if (updates.title !== undefined) {
            cleanUpdates.title = String(updates.title || '').trim()
        }

        if (updates.category !== undefined) {
            cleanUpdates.category = String(updates.category || '').trim()
        }

        if (updates.description !== undefined) {
            cleanUpdates.description = String(updates.description || '').trim()
        }

        if (updates.product_type !== undefined) {
            cleanUpdates.product_type = String(updates.product_type || '').trim()
        }

        if (updates.images) {
            cleanUpdates.images = Array.isArray(updates.images)
                ? updates.images.map(img => typeof img === 'string' ? img : img.src)
                : []
        }

        if (updates.tags) {
            cleanUpdates.tags = Array.isArray(updates.tags) ? updates.tags : []
        }

        if (updates.price !== undefined) {
            cleanUpdates.price = parseFloat(updates.price) || 0
        }

        if (updates.compare_price !== undefined) {
            cleanUpdates.compare_price = updates.compare_price ? parseFloat(updates.compare_price) : null
        }

        if (updates.stock !== undefined) {
            cleanUpdates.stock = parseInt(updates.stock) || 0
        }

        const { data, error } = await supabase
            .from('products')
            .update(cleanUpdates)
            .eq('id', id)
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