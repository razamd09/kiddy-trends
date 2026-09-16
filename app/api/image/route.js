import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

function getSupabaseOrigin() {
    const raw = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
    if (!raw) return ''

    try {
        return new URL(raw).origin
    } catch {
        return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
    }
}

function toAbsoluteUrl(url) {
    const trimmed = String(url || '').trim()
    if (!trimmed) return ''
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    if (trimmed.startsWith('/')) {
        const origin = getSupabaseOrigin()
        return origin ? origin + trimmed : trimmed
    }
    return trimmed
}

function getSupabaseStoragePath(url) {
    if (typeof url !== 'string') return null

    const trimmed = url.trim()
    if (!trimmed) return null

    const publicMarker = '/storage/v1/object/public/products/'
    const signedMarker = '/storage/v1/object/sign/products/'

    if (trimmed.startsWith('images/')) {
        return trimmed.split('?')[0]
    }
    if (trimmed.includes(publicMarker)) {
        return trimmed.split(publicMarker)[1].split('?')[0]
    }
    if (trimmed.includes(signedMarker)) {
        return trimmed.split(signedMarker)[1].split('?')[0]
    }

    return null
}

// Fetches the resolved upstream URL and streams the bytes back directly
// instead of issuing an HTTP redirect. next/image's optimizer (/_next/image)
// has been seen failing to follow the redirect and caching that failure as a
// 404, which then persists until the cache entry expires — proxying the
// bytes ourselves removes that whole failure mode.
async function proxyImage(url) {
    const target = toAbsoluteUrl(url)
    const upstream = await fetch(target)

    if (!upstream.ok || !upstream.body) {
        return Response.json({ success: false, error: 'Upstream image fetch failed' }, { status: 502 })
    }

    const contentType = upstream.headers.get('content-type') || 'image/webp'
    return new Response(upstream.body, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
        },
    })
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const src = (searchParams.get('src') || '').trim()

        if (!src) {
            return Response.json({ success: false, error: 'Missing image source' }, { status: 400 })
        }

        const storagePath = getSupabaseStoragePath(src)
        if (storagePath) {
            const { data: signedData, error: signError } = await supabase.storage
                .from('products')
                .createSignedUrl(storagePath, 60 * 60)

            if (!signError && signedData?.signedUrl) {
                return await proxyImage(signedData.signedUrl)
            }

            const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(storagePath)
            if (publicUrlData?.publicUrl) {
                return await proxyImage(publicUrlData.publicUrl)
            }
        }

        if (/^https?:\/\//i.test(src)) {
            return await proxyImage(src)
        }

        return Response.json({ success: false, error: 'Unable to resolve image URL' }, { status: 404 })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}