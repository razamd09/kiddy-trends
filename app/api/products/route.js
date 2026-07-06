import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)
const DRAFT_SOURCE = 'draft_workspace'

function collectImageUrls(value, urls) {
    if (Array.isArray(value)) {
        value.forEach((item) => collectImageUrls(item, urls))
        return urls
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) return urls

        try {
            const parsed = JSON.parse(trimmed)
            if (parsed && parsed !== value) {
                collectImageUrls(parsed, urls)
                return urls
            }
        } catch {}

        if (trimmed.includes('\n')) {
            trimmed
                .split('\n')
                .map((entry) => entry.trim())
                .filter(Boolean)
                .forEach((entry) => urls.push(entry))
            return urls
        }

        urls.push(trimmed)
        return urls
    }

    if (value && typeof value === 'object') {
        const directFields = [
            value.src,
            value.url,
            value.image,
            value.path,
            value.publicUrl,
            value.signedUrl,
            value.original,
            value.originalUrl,
            value.editedUrl,
        ]

        const hadDirectField = directFields.some((entry) => typeof entry === 'string' && entry.trim())
        if (hadDirectField) {
            directFields.forEach((entry) => collectImageUrls(entry, urls))
            return urls
        }

        if (Array.isArray(value.images)) {
            collectImageUrls(value.images, urls)
        }
    }

    return urls
}

function normalizeImages(images) {
    return Array.from(new Set(collectImageUrls(images, []).filter(Boolean)))
}

function toImageProxyUrl(src) {
    const trimmed = String(src || '').trim()
    if (!trimmed) return ''
    return '/api/image?src=' + encodeURIComponent(trimmed)
}

function normalizeTags(tags) {
    if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean)
    if (typeof tags === 'string') return tags.split(',').map((t) => t.trim()).filter(Boolean)
    return []
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

    const imageUrls = normalizeImages(product.images).filter(url => url && url.trim())

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
        images: imageUrls
            .map((src) => {
                const trimmedSrc = String(src).trim()
                return trimmedSrc ? { src: trimmedSrc } : null
            })
            .filter(Boolean),
        variants,
        options,
        stock: product.stock || 0,
        is_active: product.is_active !== false,
        product_version: product.product_version || null,
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
                    .or('source.is.null,source.neq.' + DRAFT_SOURCE)
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
                    .or('source.is.null,source.neq.' + DRAFT_SOURCE)
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
                    .or('source.is.null,source.neq.' + DRAFT_SOURCE)
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
                .or('source.is.null,source.neq.' + DRAFT_SOURCE)
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
                    .or('source.is.null,source.neq.' + DRAFT_SOURCE)
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

        const productsWithStableImageUrls = filtered.map((product) => {
            const imageUrls = normalizeImages(product.images)
            const proxiedUrls = imageUrls.map(toImageProxyUrl).filter(Boolean)
            return { ...product, images: proxiedUrls }
        })

        const transformedProducts = productsWithStableImageUrls
            .map(transformProduct)
            .sort((a, b) => {
                function versionPriority(p) {
                    const v = String(p?.product_version || '').toLowerCase()
                    return v === 'new arrivals' ? 2 : 0
                }
                const aVer = versionPriority(a)
                const bVer = versionPriority(b)
                if (bVer - aVer !== 0) return bVer - aVer

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
