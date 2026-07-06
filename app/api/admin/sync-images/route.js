import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

async function downloadImage(imageUrl) {
    try {
        const response = await fetch(imageUrl)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.arrayBuffer()
    } catch (err) {
        console.error(`Failed to download ${imageUrl}:`, err.message)
        return null
    }
}

async function optimizeAndUploadImage(imageBuffer, fileName) {
    try {
        const optimized = await sharp(imageBuffer)
            .rotate()
            .resize(1200, 1200, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 },
                withoutEnlargement: false,
            })
            .webp({ quality: 85 })
            .toBuffer()

        const fileNameWebP = fileName.replace(/\.[^.]+$/, '') + '.webp'
        const timestamp = Date.now()
        const { data, error } = await supabase.storage
            .from('products')
            .upload(`images/${timestamp}-${fileNameWebP}`, optimized, {
                contentType: 'image/webp',
                cacheControl: '31536000'
            })

        if (error) throw error
        
        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(`images/${timestamp}-${fileNameWebP}`)
        
        return publicUrl
    } catch (err) {
        console.error(`Failed to optimize/upload image:`, err.message)
        return null
    }
}

export async function POST(request) {
    try {
        const { data: products, error: fetchError } = await supabase
            .from('products')
            .select('id, images')
            .not('images', 'is', null)

        if (fetchError) {
            return Response.json({ success: false, error: fetchError.message }, { status: 500 })
        }

        const results = {
            totalProducts: products.length,
            processed: 0,
            failed: 0,
            skipped: 0,
            errors: []
        }

        for (const product of products) {
            try {
                if (!product.images || product.images.length === 0) {
                    results.skipped++
                    continue
                }

                const newImages = []

                for (const imageUrl of product.images) {
                    // Skip if already Supabase URL
                    if (typeof imageUrl === 'string' && imageUrl.includes('supabase')) {
                        newImages.push(imageUrl)
                        continue
                    }

                    const urlStr = typeof imageUrl === 'string' ? imageUrl : imageUrl.src

                    // Download from Shopify
                    const buffer = await downloadImage(urlStr)
                    if (!buffer) {
                        newImages.push(urlStr) // Keep old URL as fallback
                        continue
                    }

                    // Extract filename
                    const urlObj = new URL(urlStr)
                    const fileName = urlObj.pathname.split('/').pop() || 'image'

                    // Upload to Supabase
                    const newUrl = await optimizeAndUploadImage(buffer, fileName)
                    if (newUrl) {
                        newImages.push(newUrl)
                    } else {
                        newImages.push(urlStr) // Fallback
                    }
                }

                // Update product with new images
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ 
                        images: newImages,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', product.id)

                if (updateError) {
                    results.failed++
                    results.errors.push({ productId: product.id, error: updateError.message })
                } else {
                    results.processed++
                }
            } catch (err) {
                results.failed++
                results.errors.push({ productId: product.id, error: err.message })
            }
        }

        return Response.json({ success: true, results })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
