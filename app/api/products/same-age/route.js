import { createClient } from '@supabase/supabase-js'
import { productMatchesAgeId } from '../../../../lib/ageBrackets'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

function firstImageUrl(images) {
    if (!Array.isArray(images) || images.length === 0) return null
    const first = images[0]
    if (typeof first === 'string') return first
    return first?.src || first?.url || first?.image || null
}

// Matches /api/products' own image handling: stored URLs are signed and
// expire, so route every image through the /api/image proxy (which re-signs
// on request) rather than returning the raw stored URL.
function getSupabaseStoragePath(url) {
    const trimmed = String(url || '').trim()
    if (!trimmed) return null
    if (trimmed.startsWith('images/')) return trimmed.split('?')[0]
    const publicMarker = '/storage/v1/object/public/products/'
    const signedMarker = '/storage/v1/object/sign/products/'
    if (trimmed.includes(publicMarker)) return trimmed.split(publicMarker)[1].split('?')[0]
    if (trimmed.includes(signedMarker)) return trimmed.split(signedMarker)[1].split('?')[0]
    return null
}

function toImageProxyUrl(src) {
    const trimmed = String(src || '').trim()
    if (!trimmed) return ''
    const storagePath = getSupabaseStoragePath(trimmed)
    return '/api/image?src=' + encodeURIComponent(storagePath || trimmed)
}

// Lightweight cohort list for the product page's swipe/arrow navigation —
// "other products in this same size". Filters server-side over the whole
// catalog so the client only ever receives the small matching subset.
export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const ageId = (searchParams.get('ageId') || '').trim()
    const currentId = parseInt(searchParams.get('currentId') || '', 10)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '150', 10) || 150, 1), 200)

    if (!ageId) {
        return Response.json({ success: false, error: 'ageId is required' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('products')
        .select('id, shopify_handle, title, images, price, product_type, tags, variants')
        .eq('is_active', true)
        .order('id', { ascending: true })

    if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

    const matched = (data || []).filter((p) => productMatchesAgeId({
        title: p.title,
        product_type: p.product_type,
        tags: p.tags,
        variants: (Array.isArray(p.variants) ? p.variants : []).map((v) => ({
            option1: v?.option1_value || null,
            option2: v?.option2_value || null,
        })),
    }, ageId))

    // Cap the payload, but window it around the product actually on screen so
    // "next"/"previous" always has somewhere to go from wherever they started,
    // rather than truncating from the front of a large cohort.
    let windowed = matched
    if (matched.length > limit) {
        const idx = Number.isFinite(currentId) ? matched.findIndex((p) => p.id === currentId) : -1
        if (idx === -1) {
            windowed = matched.slice(0, limit)
        } else {
            const half = Math.floor(limit / 2)
            let start = Math.max(0, idx - half)
            let end = Math.min(matched.length, start + limit)
            start = Math.max(0, end - limit)
            windowed = matched.slice(start, end)
        }
    }

    const items = windowed.map((p) => ({
        id: p.id,
        handle: 'prd_id=' + p.id,
        title: p.title,
        image: toImageProxyUrl(firstImageUrl(p.images)) || null,
        price: p.price,
    }))

    return Response.json({ success: true, ageId, total: matched.length, items })
}
