import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

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

function firstImageUrl(images) {
    const list = Array.isArray(images) ? images : []
    const first = list[0]
    if (!first) return null
    return typeof first === 'string' ? first : (first?.src || first?.url || first?.image || null)
}

// One tile per currently active campaign (/admin/campaigns), each tile's
// image borrowed from the first product pinned to that campaign's slot
// list — campaigns don't have their own banner image, only pinned products.
export async function GET() {
    try {
        const { data: activeCampaigns, error: campaignsError } = await supabase
            .from('campaigns')
            .select('campaign_number, name')
            .eq('is_active', true)
            .order('campaign_number', { ascending: true })

        if (campaignsError) return Response.json({ success: false, error: campaignsError.message }, { status: 500 })
        if (!activeCampaigns || activeCampaigns.length === 0) {
            return Response.json({ success: true, campaigns: [] })
        }

        const activeNumbers = activeCampaigns.map((c) => c.campaign_number)
        const { data: slots, error: slotsError } = await supabase
            .from('campaign_slots')
            .select('campaign_number, product_id, position')
            .in('campaign_number', activeNumbers)
            .order('position', { ascending: true })

        if (slotsError) return Response.json({ success: false, error: slotsError.message }, { status: 500 })

        const firstProductIdByCampaign = new Map()
        for (const slot of slots || []) {
            if (!firstProductIdByCampaign.has(slot.campaign_number)) {
                firstProductIdByCampaign.set(slot.campaign_number, slot.product_id)
            }
        }

        const productIds = Array.from(new Set(Array.from(firstProductIdByCampaign.values())))
        let productById = new Map()
        if (productIds.length > 0) {
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id, images')
                .in('id', productIds)
            if (productsError) return Response.json({ success: false, error: productsError.message }, { status: 500 })
            productById = new Map((products || []).map((p) => [p.id, p]))
        }

        const rawImageUrls = Array.from(firstProductIdByCampaign.values())
            .map((id) => firstImageUrl(productById.get(id)?.images))
            .filter(Boolean)

        const storagePathByUrl = new Map()
        for (const url of rawImageUrls) {
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
        function resolveImage(url) {
            if (!url) return null
            const path = storagePathByUrl.get(url)
            return (path && signedUrlByPath.get(path)) || url
        }

        const campaigns = activeCampaigns.map((c) => {
            const productId = firstProductIdByCampaign.get(c.campaign_number)
            const rawImage = firstImageUrl(productById.get(productId)?.images)
            return {
                campaignNumber: c.campaign_number,
                name: c.name,
                href: '/campaign' + c.campaign_number,
                image: resolveImage(rawImage),
            }
        })

        const response = Response.json({ success: true, campaigns })
        response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300')
        return response
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
