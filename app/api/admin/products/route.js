import { createClient } from '@supabase/supabase-js'
import { normalizeVariants } from '../../../../lib/variantNormalization'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)
const DRAFT_SOURCE = 'draft_workspace'
const signedUrlCache = new Map()
const SIGNED_URL_TTL_MS = 29 * 24 * 60 * 60 * 1000
const SIGNED_URL_BUFFER_MS = 5 * 60 * 1000

function normalizeVariantText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/years?/g, 'y')
        .replace(/[^a-z0-9]/g, '')
}

function parseVariants(rawVariants) {
    if (Array.isArray(rawVariants)) return normalizeVariants(rawVariants)
    if (typeof rawVariants === 'string') {
        const trimmed = rawVariants.trim()
        if (!trimmed) return []
        try {
            const parsed = JSON.parse(trimmed)
            return Array.isArray(parsed) ? normalizeVariants(parsed) : []
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

function sortProductsList(list, sortBy, ascending) {
    const direction = ascending ? 1 : -1
    const items = Array.isArray(list) ? [...list] : []

    return items.sort((a, b) => {
        if (sortBy === 'variant_count') {
            return (parseVariants(a?.variants).length - parseVariants(b?.variants).length) * direction
        }

        if (sortBy === 'price' || sortBy === 'stock') {
            return ((Number(a?.[sortBy]) || 0) - (Number(b?.[sortBy]) || 0)) * direction
        }

        if (sortBy === 'is_active') {
            return (((a?.is_active ? 1 : 0) - (b?.is_active ? 1 : 0)) * direction)
        }

        if (sortBy === 'created_at' || sortBy === 'updated_at' || sortBy === 'last_action_at') {
            return (((new Date(a?.[sortBy] || 0).getTime() || 0) - (new Date(b?.[sortBy] || 0).getTime() || 0)) * direction)
        }

        return String(a?.[sortBy] || '').localeCompare(String(b?.[sortBy] || ''), undefined, {
            sensitivity: 'base',
            numeric: true,
        }) * direction
    })
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

function getActorIdentity(request) {
    const actorId = String(request.headers.get('x-actor-id') || '').trim()
    const actorRole = String(request.headers.get('x-actor-role') || '').trim().toLowerCase()

    if (actorId) {
        if (actorRole) return actorId + ' (' + actorRole + ')'
        return actorId
    }

    return 'admin (admin)'
}

function validateRequiredProductFields(payload) {
    const productType = String(payload?.product_type || '').trim()
    const productVersion = String(payload?.product_version || '').trim()
    const status = payload?.status !== undefined
        ? String(payload.status || '').trim()
        : (payload?.is_active === true ? 'active' : payload?.is_active === false ? 'draft' : '')

    if (!productType) return 'Product Type is required'
    if (!productVersion) return 'Product Version is required'
    if (!status) return 'Status is required'
    return null
}

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const page   = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit  = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100)
    const offset = (page - 1) * limit
    const category = (searchParams.get('category') || '').trim()
    const search = (searchParams.get('search') || '').trim()
    const variant = (searchParams.get('variant') || '').trim()
    const sortByRaw = (searchParams.get('sortBy') || 'created_at').trim()
    const sortDirRaw = (searchParams.get('sortDir') || 'desc').trim().toLowerCase()
    const sortByAllowed = ['created_at', 'updated_at', 'price', 'title', 'stock', 'category', 'is_active', 'last_action_at', 'variant_count']
    const sortBy = sortByAllowed.includes(sortByRaw) ? sortByRaw : 'created_at'
    const ascending = sortDirRaw === 'asc'
    const needsComputedSort = sortBy === 'variant_count'

    let data = []
    let error = null
    let count = 0

    if (variant) {
        let variantQuery = supabase
            .from('products')
            .select('*')

        if (category && category !== 'all') {
            variantQuery = variantQuery.eq('category', category)
        }
        if (search) {
            variantQuery = variantQuery.ilike('title', '%' + search + '%')
        }

        variantQuery = variantQuery.order(needsComputedSort ? 'id' : sortBy, { ascending })
        let variantResult = await variantQuery
        if (variantResult.error && /(created_at|updated_at)/i.test(variantResult.error.message || '')) {
            let fallbackVariantQuery = supabase
                .from('products')
                .select('*')
                .or('source.is.null,source.neq.' + DRAFT_SOURCE)
            if (category && category !== 'all') {
                fallbackVariantQuery = fallbackVariantQuery.eq('category', category)
            }
            if (search) {
                fallbackVariantQuery = fallbackVariantQuery.ilike('title', '%' + search + '%')
            }
            variantResult = await fallbackVariantQuery.order('id', { ascending: false })
        }

        if (variantResult.error) {
            error = variantResult.error
        } else {
            const variantFiltered = (variantResult.data || []).filter((product) =>
                productMatchesVariant(product.variants, variant)
            )
            const sortedVariantFiltered = sortProductsList(variantFiltered, sortBy, ascending)
            count = sortedVariantFiltered.length
            data = sortedVariantFiltered.slice(offset, offset + limit)
        }
    } else {
        let query = supabase
            .from('products')
            .select('*', { count: 'exact' })
            .or('source.is.null,source.neq.' + DRAFT_SOURCE)
        if (category && category !== 'all') {
            query = query.eq('category', category)
        }
        if (search) {
            query = query.ilike('title', '%' + search + '%')
        }
        query = query.order(needsComputedSort ? 'id' : sortBy, { ascending })
        if (!needsComputedSort) {
            query = query.range(offset, offset + limit - 1)
        }
        const result = await query
        data = result.data
        error = result.error
        count = result.count

        if (!error && needsComputedSort) {
            const sorted = sortProductsList(data || [], sortBy, ascending)
            data = sorted.slice(offset, offset + limit)
            count = sorted.length
        }
    }

    // Some older tables may not have created_at/updated_at; fallback to id ordering.
    if (error && /(created_at|updated_at)/i.test(error.message || '')) {
        if (variant) {
            let fallbackVariant = supabase
                .from('products')
                .select('*')
            if (category && category !== 'all') {
                fallbackVariant = fallbackVariant.eq('category', category)
            }
            if (search) {
                fallbackVariant = fallbackVariant.ilike('title', '%' + search + '%')
            }
            const fallbackResult = await fallbackVariant.order('id', { ascending: false })
            if (!fallbackResult.error) {
                const variantFiltered = (fallbackResult.data || []).filter((product) =>
                    productMatchesVariant(product.variants, variant)
                )
                const sortedVariantFiltered = sortProductsList(variantFiltered, sortBy, ascending)
                data = sortedVariantFiltered.slice(offset, offset + limit)
                count = sortedVariantFiltered.length
                error = null
            } else {
                error = fallbackResult.error
            }
        } else {
            let fallback = supabase
                .from('products')
                .select('*', { count: 'exact' })
                .or('source.is.null,source.neq.' + DRAFT_SOURCE)
            if (category && category !== 'all') {
                fallback = fallback.eq('category', category)
            }
            if (search) {
                fallback = fallback.ilike('title', '%' + search + '%')
            }
            fallback = fallback.order('id', { ascending: false })
            const fallbackResult = await fallback
            data = fallbackResult.data
            error = fallbackResult.error
            if (!fallbackResult.error) {
                const sortedFallback = sortProductsList(fallbackResult.data || [], sortBy, ascending)
                data = sortedFallback.slice(offset, offset + limit)
                count = sortedFallback.length
            } else {
                count = fallbackResult.count
            }
        }
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
            variants: parseVariants(product.variants),
        }
    }))

    const response = Response.json({ success: true, products, total: count || 0 })
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=120')
    return response
}

export async function POST(request) {
    try {
        const body = await request.json()
            const validationError = validateRequiredProductFields(body)
            if (validationError) {
                return Response.json({ success: false, error: validationError }, { status: 400 })
            }
            const actorIdentity = getActorIdentity(request)
            const isActive = typeof body.is_active !== 'undefined' ? !!body.is_active : (body.status ? String(body.status) === 'active' : true)

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
                    variants:      normalizeVariants(body.variants || []),
                    stock:         parseInt(body.stock) || 0,
                    is_active:     isActive,
                    source:        'custom',
                    product_version: body.product_version || null,
                    shopify_handle: body.shopify_handle || null,
                    last_action_by: actorIdentity,
                    last_action_type: 'added',
                    last_action_at: new Date().toISOString(),
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

        const validationError = validateRequiredProductFields(updates)
        if (validationError) {
            return Response.json({ success: false, error: validationError }, { status: 400 })
        }

        const actorIdentity = getActorIdentity(request)
        const cleanUpdates = {
            ...updates,
            updated_at: new Date().toISOString(),
            last_action_type: 'edited by ' + actorIdentity,
            last_action_at: new Date().toISOString(),
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

        if (updates.product_version !== undefined) {
            cleanUpdates.product_version = String(updates.product_version || '').trim()
        }

        if (updates.variants !== undefined) {
            cleanUpdates.variants = normalizeVariants(updates.variants || [])
        }

        if (updates.is_active !== undefined) {
            cleanUpdates.is_active = !!updates.is_active
        } else if (updates.status !== undefined) {
            cleanUpdates.is_active = String(updates.status) === 'active'
        }

        delete cleanUpdates.status

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

        if (!error) {
            // Log deletion (optional: store in audit_log table if created)
            console.log('Product deleted by admin:', id)
        }

        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true })
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 })
    }
}