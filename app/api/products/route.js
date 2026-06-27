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
            .map((img) => (typeof img === 'string' ? img : img?.src))
            .filter(Boolean)
    }

    if (typeof images === 'string') {
        const trimmed = images.trim()
        if (!trimmed) return []

        try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) {
                return parsed
                    .map((img) => (typeof img === 'string' ? img : img?.src))
                    .filter(Boolean)
            }
        } catch {}

        if (trimmed.includes('\n')) {
            return trimmed.split('\n').map((s) => s.trim()).filter(Boolean)
        }

        return [trimmed]
    }

    return []
}

function normalizeTags(tags) {
    if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean)
    if (typeof tags === 'string') return tags.split(',').map((t) => t.trim()).filter(Boolean)
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

function seededNumericId(value) {
    const text = String(value || '')
    let hash = 0
    for (let i = 0; i < text.length; i++) {
        hash = ((hash * 31) + text.charCodeAt(i)) | 0
    }
    return Math.abs(hash)
}

function normalizeHandleValue(value) {
    const text = String(value || '')
    let decoded = text
    try {
        decoded = decodeURIComponent(text)
    } catch {}
    return decoded.trim().toLowerCase().replace(/^\/+|\/+$/g, '')
}

function safeDecode(value) {
    try {
        return decodeURIComponent(String(value || ''))
    } catch {
        return String(value || '')
    }
}

function slugifyTitle(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

function getTitlePriority(title) {
    const t = String(title || '').toLowerCase()
    if (t.includes('summer new arrival 2026')) return 2
    if (t.includes('2026')) return 1
    return 0
}

function transformProduct(product) {
    const rawVariants = Array.isArray(product.variants) ? product.variants : []
    const hasRealVariants = rawVariants.some((v) => v && v.option1_value)

    let variants
    if (hasRealVariants) {
        variants = rawVariants.map((v, i) => ({
            id: String(product.id) + '_' + i,
            title: [v.option1_value, v.option2_value].filter(Boolean).join(' / ') || 'Default Title',
            price: String(v.price ?? product.price ?? 0),
            compare_at_price: String(product.compare_price || 0),
            available: (v.inventory_qty ?? 0) > 0,
            inventory_management: 'kiddy',
            inventory_quantity: v.inventory_qty ?? 0,
            option1: v.option1_value || null,
            option2: v.option2_value || null,
            sku: v.sku || '',
        }))
    } else {
        variants = [{
            id: String(product.id) + '_0',
            title: 'Default Title',
            price: String(product.price || 0),
            compare_at_price: String(product.compare_price || 0),
            available: (product.stock ?? 0) > 0,
            inventory_management: 'kiddy',
            inventory_quantity: product.stock ?? 0,
            option1: null,
            option2: null,
            sku: '',
        }]
    }

    const opt1Values = Array.from(new Set(variants.map((v) => v.option1).filter(Boolean)))
    const opt2Values = Array.from(new Set(variants.map((v) => v.option2).filter(Boolean)))
    const options = []
    if (opt1Values.length > 0) options.push({ name: rawVariants[0]?.option1_name || 'Size', values: opt1Values })
    if (opt2Values.length > 0) options.push({ name: rawVariants[0]?.option2_name || 'Color', values: opt2Values })

    const imageUrls = normalizeImages(product.images)

    return {
        id: seededNumericId(product.id),
        _id: product.id,
        handle: product.shopify_handle || String(product.id),
        title: product.title,
        description: product.description || '',
        body_html: product.description || '',
        product_type: product.product_type || '',
        category: product.category || '',
        tags: normalizeTags(product.tags),
        created_at: product.created_at || new Date().toISOString(),
        images: imageUrls.map((src) => ({ src })).filter((img) => img.src),
        variants,
        options,
        stock: product.stock || 0,
        is_active: product.is_active !== false,
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
        const requestedLimit = parseInt(searchParams.get('limit') || '40', 10)
        const limit = Math.min(Math.max(requestedLimit || 40, 1), 400)
        const search = (searchParams.get('search') || '').trim()
        const handle = (searchParams.get('handle') || '').trim()
        const category = (searchParams.get('category') || '').trim()
        const offset = (page - 1) * limit

        let data = []
        let count = 0
        let error = null

        if (handle) {
            const candidates = Array.from(new Set([
                handle.trim(),
                normalizeHandleValue(handle),
                safeDecode(handle),
            ].filter(Boolean)))

            for (const candidate of candidates) {
                const byHandle = await supabase
                    .from('products')
                    .select('*', { count: 'exact' })
                    .eq('is_active', true)
                    .eq('shopify_handle', candidate)
                    .limit(1)
                if (!byHandle.error && (byHandle.data || []).length > 0) {
                    data = byHandle.data
                    count = byHandle.count || byHandle.data.length
                    break
                }
            }

            if (data.length === 0) {
                const byId = await supabase
                    .from('products')
                    .select('*', { count: 'exact' })
                    .eq('is_active', true)
                    .eq('id', handle)
                    .limit(1)
                if (!byId.error && (byId.data || []).length > 0) {
                    data = byId.data
                    count = byId.count || byId.data.length
                }
            }

            if (data.length === 0) {
                const slugQuery = slugifyTitle(handle).replace(/-/g, ' ').trim()
                const byTitle = await supabase
                    .from('products')
                    .select('*', { count: 'exact' })
                    .eq('is_active', true)
                    .ilike('title', '%' + slugQuery + '%')
                    .limit(20)
                if (!byTitle.error) {
                    data = byTitle.data || []
                    count = byTitle.count || data.length
                } else {
                    error = byTitle.error
                }
            }
        } else {
            let query = supabase
                .from('products')
                .select('*', { count: 'exact' })
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (category) query = query.eq('category', category)
            if (search) {
                const escaped = search.replace(/,/g, ' ')
                query = query.or(`title.ilike.%${escaped}%,product_type.ilike.%${escaped}%`)
            }

            const result = await query.range(offset, offset + limit - 1)
            data = result.data
            error = result.error
            count = result.count

            if (error && /created_at/i.test(error.message || '')) {
                let fallback = supabase
                    .from('products')
                    .select('*', { count: 'exact' })
                    .eq('is_active', true)
                    .order('id', { ascending: false })

                if (category) fallback = fallback.eq('category', category)
                if (search) {
                    const escaped = search.replace(/,/g, ' ')
                    fallback = fallback.or(`title.ilike.%${escaped}%,product_type.ilike.%${escaped}%`)
                }
                const fallbackResult = await fallback.range(offset, offset + limit - 1)
                data = fallbackResult.data
                error = fallbackResult.error
                count = fallbackResult.count
            }
        }

        if (error) {
            return Response.json({ success: false, error: error.message }, { status: 500 })
        }

        let filtered = data || []
        if (handle) {
            const target = normalizeHandleValue(handle)
            filtered = filtered.filter((p) => {
                const productHandle = normalizeHandleValue(p.shopify_handle)
                const productId = normalizeHandleValue(p.id)
                const titleSlug = slugifyTitle(p.title)
                return productHandle === target || productId === target || titleSlug === target
            })
        }

        const productsWithSignedUrls = await Promise.all(filtered.map(async (product) => {
            const imageUrls = normalizeImages(product.images)
            const signedUrls = await Promise.all(imageUrls.map(resolveSignedImageUrl))

            return { ...product, images: signedUrls }
        }))

        const transformedProducts = productsWithSignedUrls
            .map(transformProduct)
            .sort((a, b) => {
                const priorityDiff = getTitlePriority(b.title) - getTitlePriority(a.title)
                if (priorityDiff !== 0) return priorityDiff
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            })

        const total = count || transformedProducts.length || 0
        const paginatedProducts = transformedProducts
        const pages = Math.max(Math.ceil(total / limit), 1)

        const response = Response.json({
            success: true,
            products: paginatedProducts,
            total,
            page,
            pages,
        })
        response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300')
        return response
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
