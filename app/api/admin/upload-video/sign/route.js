import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export const dynamic = 'force-dynamic'

const ALLOWED_EXTENSIONS = ['mp4', 'mov', 'webm', 'm4v', 'avi', 'mkv']
const MAX_SIZE_BYTES = 150 * 1024 * 1024 // 150MB — generous for a short product clip

// Step 1 of the video upload flow: mints a signed upload URL so the browser
// can PUT the file bytes straight to Supabase Storage, bypassing this
// serverless function entirely. Vercel's Node runtime caps a function's
// request body at 4.5MB — any real video clip blows past that, so routing
// the bytes through our own API (the way image upload works) isn't an
// option here.
export async function POST(request) {
    try {
        const { fileName, fileSize } = await request.json()
        if (!fileName) {
            return Response.json({ success: false, error: 'fileName is required' }, { status: 400 })
        }

        const ext = String(fileName).split('.').pop()?.toLowerCase() || ''
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return Response.json({ success: false, error: 'Unsupported video format .' + ext + ' — use MP4, MOV, WEBM, M4V, AVI or MKV' }, { status: 400 })
        }

        if (fileSize && Number(fileSize) > MAX_SIZE_BYTES) {
            return Response.json({ success: false, error: 'Video is too large (max 150MB)' }, { status: 400 })
        }

        const safeBaseName = String(fileName)
            .replace(/\.[^.]+$/, '')
            .replace(/[^a-zA-Z0-9_-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'video'
        const path = `videos/${Date.now()}-${safeBaseName}.${ext}`

        const { data, error } = await supabase.storage
            .from('products')
            .createSignedUploadUrl(path)

        if (error) {
            return Response.json({ success: false, error: error.message }, { status: 500 })
        }

        return Response.json({ success: true, path, token: data.token })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
