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

        // Optimize image
        const optimized = await sharp(fileBuffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer()

        const fileNameWebP = fileName.replace(/\.[^.]+$/, '') + '.webp'
        const timestamp = Date.now()
        const path = `images/${timestamp}-${fileNameWebP}`

        const { data, error } = await supabase.storage
            .from('products')
            .upload(path, optimized, {
                contentType: 'image/webp',
                cacheControl: '31536000'
            })

        if (error) {
            return Response.json({ success: false, error: error.message }, { status: 500 })
        }

        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(path)

        return Response.json({ success: true, url: publicUrl })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
