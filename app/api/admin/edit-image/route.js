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

function parseHexColor(hex) {
    const value = String(hex || '').trim().replace('#', '')
    if (!/^[0-9a-fA-F]{6}$/.test(value)) {
        return { r: 255, g: 255, b: 255, alpha: 1 }
    }
    return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16),
        alpha: 1,
    }
}

async function removeNearWhiteBackground(image, sharpLib) {
    const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

    const output = Buffer.from(data)
    for (let i = 0; i < output.length; i += 4) {
        const r = output[i]
        const g = output[i + 1]
        const b = output[i + 2]
        const a = output[i + 3]

        const min = Math.min(r, g, b)
        const max = Math.max(r, g, b)
        const spread = max - min

        // Strongly remove near-white/near-gray backgrounds.
        if (min >= 236 && spread <= 20) {
            output[i + 3] = 0
            continue
        }

        // Soft-edge fade for almost-white pixels to reduce jagged borders.
        if (min >= 220 && spread <= 32) {
            output[i + 3] = Math.max(0, Math.min(255, Math.round(a * 0.35)))
        }
    }

    return sharpLib(output, {
        raw: {
            width: info.width,
            height: info.height,
            channels: info.channels,
        },
    })
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

        if (removeBackground) {
            image = await removeNearWhiteBackground(image, sharp)
        }

        const metadata = await image.metadata()
        if (fit === 'contain' && metadata.width && metadata.height) {
            const side = Math.max(metadata.width, metadata.height)
            image = image.resize(side, side, {
                fit: 'contain',
                background: parseHexColor(background),
                withoutEnlargement: false,
            })
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
