import { createClient } from '@supabase/supabase-js'
import { removeBackgroundWithSafety } from '../_utils/background-removal'

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

function parseHexColor(hex) {
    const normalized = String(hex || '').trim().toLowerCase()
    if (!normalized) return { r: 255, g: 255, b: 255, alpha: 1 }
    if (normalized === 'transparent') {
        return { r: 255, g: 255, b: 255, alpha: 0 }
    }

    let value = normalized.replace('#', '')
    if (/^[0-9a-f]{3}$/.test(value)) {
        value = value.split('').map((c) => c + c).join('')
    }

    if (!/^[0-9a-f]{6}$/.test(value)) {
        return { r: 255, g: 255, b: 255, alpha: 1 }
    }

    return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16),
        alpha: 1,
    }
}

export async function POST(request) {
    try {
        const {
            url,
            rotate = 0,
            flipHorizontal = false,
            flipVertical = false,
            fit = 'cover',
            background = '#ffffff',
            removeBackground = false,
        } = await request.json()

        if (!url) {
            return Response.json({ error: 'url is required' }, { status: 400 })
        }

        const storagePath = getSupabaseStoragePath(url)
        if (!storagePath) {
            return Response.json({ error: 'Only Supabase CDN images can be edited' }, { status: 400 })
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

        let image = sharp(buffer)

        const rotateValue = Number(rotate) || 0
        if (rotateValue !== 0) image = image.rotate(rotateValue)
        if (flipHorizontal) image = image.flop()
        if (flipVertical) image = image.flip()

        const effectiveBackground = (removeBackground && String(background || '').trim().toLowerCase() === 'transparent')
            ? '#ffffff'
            : background

        if (removeBackground) {
            const result = await removeBackgroundWithSafety(image, sharp)
            image = result.image
        }

        const metadata = await image.metadata()
        if (fit === 'contain' && metadata.width && metadata.height) {
            const side = Math.max(metadata.width, metadata.height)
            image = image.resize(side, side, {
                fit: 'contain',
                background: parseHexColor(effectiveBackground),
                withoutEnlargement: false,
            })
        }

        if (removeBackground) {
            image = image.flatten({ background: parseHexColor(effectiveBackground) })
        }

        const edited = await image
            .webp({ quality: 90 })
            .toBuffer()

        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(storagePath, edited, {
                contentType: 'image/webp',
                upsert: true,
            })

        if (uploadError) {
            return Response.json({ error: 'Failed to save edited image: ' + uploadError.message }, { status: 500 })
        }

        const { data: signedData } = await supabase.storage
            .from('products')
            .createSignedUrl(storagePath, 60 * 60 * 24 * 30)

        return Response.json({ success: true, url: signedData?.signedUrl || url })
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 })
    }
}
