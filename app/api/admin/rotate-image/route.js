import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

function getSupabaseStoragePath(url) {
    if (typeof url !== 'string') return null
    const markers = ['/storage/v1/object/public/products/', '/storage/v1/object/sign/products/']
    for (const marker of markers) {
        if (url.includes(marker)) {
            return url.split(marker)[1]?.split('?')[0]
        }
    }
    if (url.startsWith('images/')) return url.split('?')[0]
    return null
}

export async function POST(request) {
    try {
        const { url, degrees } = await request.json()
        if (!url || !degrees) {
            return Response.json({ error: 'url and degrees required' }, { status: 400 })
        }

        const storagePath = getSupabaseStoragePath(url)
        if (!storagePath) {
            return Response.json({ error: 'Only Supabase CDN images can be rotated' }, { status: 400 })
        }

        const { data: fileData, error: downloadError } = await supabase.storage
            .from('products')
            .download(storagePath)

        if (downloadError || !fileData) {
            return Response.json({ error: 'Failed to download image: ' + (downloadError?.message || 'unknown') }, { status: 500 })
        }

        const arrayBuffer = await fileData.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        let sharp
        try {
            sharp = (await import('sharp')).default
        } catch {
            return Response.json({ error: 'Sharp not available on this server' }, { status: 500 })
        }

        const rotated = await sharp(buffer)
            .rotate(Number(degrees))
            .webp({ quality: 90 })
            .toBuffer()

        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(storagePath, rotated, {
                contentType: 'image/webp',
                upsert: true,
            })

        if (uploadError) {
            return Response.json({ error: 'Failed to save rotated image: ' + uploadError.message }, { status: 500 })
        }

        const { data: signedData } = await supabase.storage
            .from('products')
            .createSignedUrl(storagePath, 60 * 60 * 24 * 30)

        return Response.json({ success: true, url: signedData?.signedUrl || url })
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 })
    }
}
