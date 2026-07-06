import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function POST(request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file')

        if (!file) {
            return Response.json({ success: false, error: 'File is required' }, { status: 400 })
        }

        const fileBuffer = await file.arrayBuffer()
        const fileName = file.name

        // Normalize every uploaded product image to a square canvas.
        const optimized = await sharp(fileBuffer)
            .rotate()
            .resize(1200, 1200, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 },
                withoutEnlargement: false,
            })
            .webp({ quality: 82, effort: 4 })
            .toBuffer()

        const safeBaseName = String(fileName || 'image')
            .replace(/\.[^.]+$/, '')
            .replace(/[^a-zA-Z0-9_-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'image'
        const fileNameWebP = safeBaseName + '.webp'
        const timestamp = Date.now()
        const path = `images/${timestamp}-${fileNameWebP}`

        const { error } = await supabase.storage
            .from('products')
            .upload(path, optimized, {
                contentType: 'image/webp',
                cacheControl: '31536000',
                upsert: false,
            })

        if (error) {
            return Response.json({ success: false, error: error.message }, { status: 500 })
        }

        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(path)

        const { data: signedData } = await supabase.storage
            .from('products')
            .createSignedUrl(path, 60 * 60 * 24 * 30)

        const immediateUrl = signedData?.signedUrl || publicUrl

        return Response.json({
            success: true,
            url: immediateUrl,
            storagePath: path,
            publicUrl,
        })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
