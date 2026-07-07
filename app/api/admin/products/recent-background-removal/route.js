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

async function removeBackground(image, sharpLib) {
    const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

    const width = info.width
    const height = info.height
    const channels = info.channels
    const pixels = width * height

    function distanceSq(r1, g1, b1, r2, g2, b2) {
        const dr = r1 - r2
        const dg = g1 - g2
        const db = b1 - b2
        return (dr * dr) + (dg * dg) + (db * db)
    }

    function sampleBorderPalette() {
        const palette = []
        const borderDepth = Math.max(6, Math.floor(Math.min(width, height) * 0.02))
        const step = Math.max(2, Math.floor(Math.min(width, height) / 220))

        const addIfOpaque = (x, y) => {
            const i = ((y * width) + x) * 4
            if ((data[i + 3] || 0) < 8) return
            palette.push([data[i], data[i + 1], data[i + 2]])
        }

        for (let y = 0; y < borderDepth; y += step) {
            for (let x = 0; x < width; x += step) addIfOpaque(x, y)
        }
        for (let y = Math.max(0, height - borderDepth); y < height; y += step) {
            for (let x = 0; x < width; x += step) addIfOpaque(x, y)
        }
        for (let x = 0; x < borderDepth; x += step) {
            for (let y = 0; y < height; y += step) addIfOpaque(x, y)
        }
        for (let x = Math.max(0, width - borderDepth); x < width; x += step) {
            for (let y = 0; y < height; y += step) addIfOpaque(x, y)
        }

        if (palette.length <= 1800) return palette
        const reduced = []
        const stride = Math.ceil(palette.length / 1800)
        for (let i = 0; i < palette.length; i += stride) reduced.push(palette[i])
        return reduced
    }

    const palette = sampleBorderPalette()
    if (palette.length === 0) {
        return sharpLib(Buffer.from(data), {
            raw: { width, height, channels },
        })
    }

    const hardThresholdSq = 34 * 34
    const relaxedThresholdSq = 58 * 58
    const localSimilaritySq = 26 * 26

    const minDistanceSq = new Uint32Array(pixels)
    const candidateMask = new Uint8Array(pixels)
    const visitedMask = new Uint8Array(pixels)
    const queue = new Uint32Array(pixels)

    for (let p = 0; p < pixels; p++) {
        const i = p * 4
        const a = data[i + 3]
        if (a < 8) {
            minDistanceSq[p] = 0
            candidateMask[p] = 1
            continue
        }

        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        let minSq = Number.MAX_SAFE_INTEGER
        for (let j = 0; j < palette.length; j++) {
            const sample = palette[j]
            const d = distanceSq(r, g, b, sample[0], sample[1], sample[2])
            if (d < minSq) {
                minSq = d
                if (minSq <= hardThresholdSq) break
            }
        }
        minDistanceSq[p] = minSq

        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const sat = max === 0 ? 0 : Math.round(((max - min) / max) * 255)
        const luma = Math.round((0.2126 * r) + (0.7152 * g) + (0.0722 * b))

        if (minSq <= hardThresholdSq || (luma >= 222 && sat <= 34)) {
            candidateMask[p] = 1
        }
    }

    let qHead = 0
    let qTail = 0
    const seed = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return
        const p = (y * width) + x
        if (!candidateMask[p] || visitedMask[p]) return
        visitedMask[p] = 1
        queue[qTail++] = p
    }

    for (let x = 0; x < width; x++) {
        seed(x, 0)
        seed(x, height - 1)
    }
    for (let y = 0; y < height; y++) {
        seed(0, y)
        seed(width - 1, y)
    }

    while (qHead < qTail) {
        const p = queue[qHead++]
        const x = p % width
        const y = Math.floor(p / width)
        const baseOffset = p * 4
        const baseR = data[baseOffset]
        const baseG = data[baseOffset + 1]
        const baseB = data[baseOffset + 2]

        const neighbors = [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1],
        ]

        for (const [nx, ny] of neighbors) {
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
            const np = (ny * width) + nx
            if (visitedMask[np]) continue

            const ni = np * 4
            const na = data[ni + 3]
            if (na < 8) {
                visitedMask[np] = 1
                queue[qTail++] = np
                continue
            }

            if (minDistanceSq[np] <= hardThresholdSq) {
                visitedMask[np] = 1
                queue[qTail++] = np
                continue
            }

            if (minDistanceSq[np] <= relaxedThresholdSq) {
                const nr = data[ni]
                const ng = data[ni + 1]
                const nb = data[ni + 2]
                if (distanceSq(baseR, baseG, baseB, nr, ng, nb) <= localSimilaritySq) {
                    visitedMask[np] = 1
                    queue[qTail++] = np
                }
            }
        }
    }

    const output = Buffer.from(data)
    for (let p = 0; p < pixels; p++) {
        if (visitedMask[p]) {
            output[(p * 4) + 3] = 0
        }
    }

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const p = (y * width) + x
            if (visitedMask[p]) continue
            const aIndex = (p * 4) + 3
            if (output[aIndex] < 8) continue

            const hasBgNeighbor = visitedMask[p - 1] || visitedMask[p + 1] || visitedMask[p - width] || visitedMask[p + width]
            if (hasBgNeighbor) {
                output[aIndex] = Math.max(0, Math.min(255, Math.round(output[aIndex] * 0.85)))
            }
        }
    }

    return sharpLib(output, {
        raw: { width, height, channels },
    })
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
    image = await removeBackground(image, sharpLib)
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
                    await processStorageImage(storagePath, sharp)
                    processedImages++
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
            skippedImages,
            failures: failures.slice(0, 50),
            failureCount: failures.length,
        })
    } catch (err) {
        return Response.json({ success: false, error: err.message || 'Unexpected error' }, { status: 500 })
    }
}
