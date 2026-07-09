import { createClient } from '@supabase/supabase-js'
import { removeBackgroundWithSafety } from '../../_utils/background-removal'

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

function normalizeImages(images) {
    if (Array.isArray(images)) {
        return images
            .map((img) => typeof img === 'string' ? img : img?.src)
            .filter(Boolean)
    }

    if (typeof images === 'string') {
        const trimmed = images.trim()
        if (!trimmed) return []

        try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) {
                return parsed
                    .map((img) => typeof img === 'string' ? img : img?.src)
                    .filter(Boolean)
            }
        } catch {}

        if (trimmed.includes('\n')) {
            return trimmed.split('\n').map((s) => s.trim()).filter(Boolean)
        }

        return [trimmed]
    }

    return []
}

async function processStorageImage(storagePath, sharpLib) {
    const { data: fileData, error: downloadError } = await supabase.storage
        .from('products')
        .download(storagePath)

    if (downloadError || !fileData) {
        throw new Error('Download failed: ' + (downloadError?.message || 'unknown'))
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let image = sharpLib(buffer)
    const removalResult = await removeBackgroundWithSafety(image, sharpLib)
    image = removalResult.image
    image = image.flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } })

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
        throw new Error('Upload failed: ' + uploadError.message)
    }

    return removalResult.method
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}))
        const days = Math.max(1, Math.min(30, Number(body?.days) || 5))
        const limit = Math.max(1, Math.min(1000, Number(body?.limit) || 600))

        let sharp
        try {
            sharp = (await import('sharp')).default
        } catch {
            return Response.json({ success: false, error: 'Sharp not available on this server' }, { status: 500 })
        }

        const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString()
        const { data: products, error } = await supabase
            .from('products')
            .select('id, title, images, created_at')
            .gte('created_at', cutoff)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            return Response.json({ success: false, error: error.message }, { status: 500 })
        }

        const failures = []
        let processedProducts = 0
        let processedImages = 0
        let skippedImages = 0
        let preservedOriginalImages = 0

        for (const product of (products || [])) {
            const images = normalizeImages(product?.images)
            if (!images.length) continue

            let productImageSuccess = 0

            for (const imageUrl of images) {
                const storagePath = getSupabaseStoragePath(imageUrl)
                if (!storagePath) {
                    skippedImages++
                    continue
                }

                try {
                    const method = await processStorageImage(storagePath, sharp)
                    processedImages++
                    if (method === 'original-preserved') preservedOriginalImages++
                    productImageSuccess++
                } catch (err) {
                    failures.push({
                        productId: product.id,
                        title: product.title || '',
                        image: storagePath,
                        error: err.message || 'Unknown error',
                    })
                }
            }

            if (productImageSuccess > 0) processedProducts++
        }

        return Response.json({
            success: true,
            days,
            scannedProducts: (products || []).length,
            processedProducts,
            processedImages,
            preservedOriginalImages,
            skippedImages,
            failures: failures.slice(0, 50),
            failureCount: failures.length,
        })
    } catch (err) {
        return Response.json({ success: false, error: err.message || 'Unexpected error' }, { status: 500 })
    }
}
