import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export const dynamic = 'force-dynamic'

// Step 2, called once the browser has PUT the video bytes directly to the
// signed URL from /sign — mints a long-lived signed read URL for it (the
// "products" bucket is private, so a plain public URL wouldn't resolve).
export async function POST(request) {
    try {
        const { path } = await request.json()
        if (!path) {
            return Response.json({ success: false, error: 'path is required' }, { status: 400 })
        }

        const { data: signedData, error } = await supabase.storage
            .from('products')
            .createSignedUrl(path, 60 * 60 * 24 * 30)

        if (error || !signedData?.signedUrl) {
            return Response.json({ success: false, error: error?.message || 'Failed to create signed URL' }, { status: 500 })
        }

        return Response.json({ success: true, url: signedData.signedUrl, storagePath: path })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
