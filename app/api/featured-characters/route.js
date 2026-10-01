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

// One tile per character that has at least one active product — characters
// with zero products (most of the catalog) are never shown, same "only
// show what's actually live" rule as the campaign tiles.
export async function GET() {
    try {
        const { data: characters, error: charactersError } = await supabase
            .from('product_characters')
            .select('id, name')
            .order('name', { ascending: true })

        if (charactersError) return Response.json({ success: false, error: charactersError.message }, { status: 500 })
        if (!characters || characters.length === 0) {
            return Response.json({ success: true, characters: [] })
        }

        const characterIds = characters.map((c) => c.id)
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, character_id, images, created_at')
            .in('character_id', characterIds)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        if (productsError) return Response.json({ success: false, error: productsError.message }, { status: 500 })

        const sampleImageByCharacterId = new Map()
        for (const product of products || []) {
            if (!sampleImageByCharacterId.has(product.character_id)) {
                const img = firstImageUrl(product.images)
                if (img) sampleImageByCharacterId.set(product.character_id, img)
            }
        }

        const rawImageUrls = Array.from(sampleImageByCharacterId.values())
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

        const result = characters
            .filter((c) => sampleImageByCharacterId.has(c.id) || (products || []).some((p) => p.character_id === c.id))
            .map((c) => ({
                characterId: c.id,
                name: c.name,
                href: '/collections?character=' + encodeURIComponent(c.name),
                image: resolveImage(sampleImageByCharacterId.get(c.id)),
            }))

        const response = Response.json({ success: true, characters: result })
        response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300')
        return response
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
