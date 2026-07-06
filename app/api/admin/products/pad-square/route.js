import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

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
            return trimmed.split('\n').map((value) => value.trim()).filter(Boolean)
        }

        return [trimmed]
    }

    return []
}

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

async function padImageToSquare(storagePath) {
    const { data, error } = await supabase.storage
        .from('products')
        .download(storagePath)

    if (error || !data) throw new Error(error?.message || 'Download failed')

    const buffer = Buffer.from(await data.arrayBuffer())
    const edited = await sharp(buffer)
        .rotate()
        .resize(1200, 1200, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 },
            withoutEnlargement: false,
        })
        .webp({ quality: 90 })
        .toBuffer()

    const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(storagePath, edited, {
            contentType: 'image/webp',
            upsert: true,
        })

    if (uploadError) throw new Error(uploadError.message)
}

export async function POST() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('id, images')
            .not('images', 'is', null)

        if (error) {
            return Response.json({ success: false, error: error.message }, { status: 500 })
        }

        const results = {
            totalProducts: products?.length || 0,
            processedImages: 0,
            skippedImages: 0,
            failedImages: 0,
            failedProducts: [],
        }

        for (const product of products || []) {
            const images = normalizeImages(product.images)
            for (const imageUrl of images) {
                const storagePath = getSupabaseStoragePath(imageUrl)
                if (!storagePath) {
                    results.skippedImages++
                    continue
                }

                try {
                    await padImageToSquare(storagePath)
                    results.processedImages++
                } catch (err) {
                    results.failedImages++
                    results.failedProducts.push({
                        productId: product.id,
                        image: storagePath,
                        error: err.message,
                    })
                }
            }
        }

        return Response.json({ success: true, results })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
