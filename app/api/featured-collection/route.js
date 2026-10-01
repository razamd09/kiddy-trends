import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

// Mirrors the image-handling in app/api/products/route.js: batch-sign every
// distinct storage path in one call and hand back a direct Supabase URL
// instead of routing through a Vercel function per image. Duplicated here
// on purpose rather than imported — same convention already used by
// app/api/products/same-age/route.js and app/feed/products.xml/route.js,
// each self-contained so a change to one never silently affects another.
function getSupabaseStoragePath(url) {
    if (typeof url !== 'string') return null
    const trimmed = url.trim()
    if (!trimmed) return null
    if (trimmed.startsWith('images/')) return trimmed.split('?')[0]
    const publicMarker = '/storage/v1/object/public/products/'
    const signedMarker = '/storage/v1/object/sign/products/'
    if (trimmed.includes(publicMarker)) return trimmed.split(publicMarker)[1].split('?')[0]
    if (trimmed.includes(signedMarker)) return trimmed.split(signedMarker)[1].split('?')[0]
    return null
}

async function resolveDirectImageUrls(urls) {
    const storagePathByUrl = new Map()
    for (const url of urls) {
        const path = getSupabaseStoragePath(url)
        if (path) storagePathByUrl.set(url, path)
    }
    const distinctPaths = Array.from(new Set(storagePathByUrl.values()))
    const signedUrlByPath = new Map()
    if (distinctPaths.length > 0) {
        const { data, error } = await supabase.storage.from('products').createSignedUrls(distinctPaths, 60 * 60 * 24)
        if (!error && Array.isArray(data)) {
            data.forEach((entry) => {
                if (entry?.signedUrl && !entry.error) signedUrlByPath.set(entry.path, entry.signedUrl)
            })
        }
    }
    const resolved = new Map()
    for (const url of urls) {
        const path = storagePathByUrl.get(url)
        resolved.set(url, (path && signedUrlByPath.get(path)) || url)
    }
    return resolved
}

function normalizeImages(images) {
    if (!Array.isArray(images)) return []
    return images
        .map((img) => (typeof img === 'string' ? img : img?.src || img?.url || img?.image || ''))
        .filter(Boolean)
}

function seededNumericId(value) {
    const text = String(value || '')
    let hash = 0
    for (let i = 0; i < text.length; i++) hash = ((hash * 31) + text.charCodeAt(i)) | 0
    return Math.abs(hash)
}

function transformProduct(product, directUrlByOriginal) {
    const imageUrls = normalizeImages(product.images).map((url) => directUrlByOriginal.get(url) || url)
    const variants = Array.isArray(product.variants) && product.variants.length > 0
        ? product.variants.map((v, i) => ({
            id: String(product.id) + '_' + i,
            title: [v.option1_value, v.option2_value].filter(Boolean).join(' / ') || 'Default Title',
            price: String(v.price ?? product.price ?? 0),
            compare_at_price: String(product.compare_price || 0),
            available: (v.inventory_qty ?? 0) > 0,
            inventory_quantity: v.inventory_qty ?? 0,
            option1: v.option1_value || null,
            option2: v.option2_value || null,
            image: v.image ? (directUrlByOriginal.get(v.image) || v.image) : null,
        }))
        : [{
            id: String(product.id) + '_0',
            title: 'Default Title',
            price: String(product.price || 0),
            compare_at_price: String(product.compare_price || 0),
            available: (product.stock ?? 0) > 0,
            inventory_quantity: product.stock ?? 0,
            option1: null,
            option2: null,
        }]

    return {
        id: seededNumericId(product.id),
        _id: product.id,
        handle: product.shopify_handle || String(product.id),
        title: product.title,
        product_type: product.product_type || '',
        category: product.category || '',
        images: imageUrls.map((src) => ({ src })),
        variants,
        stock: product.stock || 0,
    }
}

// Homepage "Featured Collection" — every product pinned to any currently
// active campaign (1-10, whichever admin has toggled on via /admin/campaigns),
// deduped since the same product can be pinned to more than one campaign at once.
export async function GET() {
    try {
        const { data: activeCampaigns, error: campaignsError } = await supabase
            .from('campaigns')
            .select('campaign_number')
            .eq('is_active', true)

        if (campaignsError) return Response.json({ success: false, error: campaignsError.message }, { status: 500 })

        const activeNumbers = (activeCampaigns || []).map((c) => c.campaign_number)
        if (activeNumbers.length === 0) {
            return Response.json({ success: true, products: [] })
        }

        const { data: slots, error: slotsError } = await supabase
            .from('campaign_slots')
            .select('product_id, position')
            .in('campaign_number', activeNumbers)
            .order('position', { ascending: true })

        if (slotsError) return Response.json({ success: false, error: slotsError.message }, { status: 500 })

        const productIds = Array.from(new Set((slots || []).map((s) => s.product_id)))
        if (productIds.length === 0) {
            return Response.json({ success: true, products: [] })
        }

        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds)
            .eq('is_active', true)

        if (productsError) return Response.json({ success: false, error: productsError.message }, { status: 500 })

        const variantImageUrls = (products || []).flatMap((p) =>
            (Array.isArray(p.variants) ? p.variants : []).map((v) => v?.image).filter(Boolean)
        )
        const allImageUrls = (products || []).flatMap((p) => normalizeImages(p.images)).concat(variantImageUrls)
        const directUrlByOriginal = await resolveDirectImageUrls(allImageUrls)

        const productById = new Map((products || []).map((p) => [p.id, p]))
        const orderedProducts = productIds
            .map((id) => productById.get(id))
            .filter(Boolean)
            .map((p) => transformProduct(p, directUrlByOriginal))

        const response = Response.json({ success: true, products: orderedProducts })
        response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300')
        return response
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
