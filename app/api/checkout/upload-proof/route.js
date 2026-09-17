import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8MB

export async function POST(request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file')

        if (!file) {
            return Response.json({ success: false, error: 'File is required' }, { status: 400 })
        }
        if (typeof file.size === 'number' && file.size > MAX_FILE_SIZE) {
            return Response.json({ success: false, error: 'Image is too large (max 8MB)' }, { status: 400 })
        }

        const fileBuffer = await file.arrayBuffer()

        // Preserve aspect ratio (unlike product photos) — this is a transaction
        // screenshot, not a square product image. Just cap the longest side.
        const optimized = await sharp(fileBuffer)
            .rotate()
            .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer()

        const timestamp = Date.now()
        const path = `payment-proofs/${timestamp}-proof.webp`

        const { error } = await supabase.storage
            .from('products')
            .upload(path, optimized, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: false,
            })

        if (error) {
            return Response.json({ success: false, error: error.message }, { status: 500 })
        }

        return Response.json({ success: true, path })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
