import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || ''
        const productId = searchParams.get('id') || ''

        if (!query && !productId) {
            return Response.json({ success: false, error: 'Missing search query or product ID' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )

        // Search by product ID first
        if (productId) {
            const { data } = await supabase
                .from('products')
                .select('handle, id, title')
                .eq('id', productId)
                .single()

            if (data?.handle) {
                return Response.json({ success: true, handle: data.handle })
            }
        }

        // Fallback: search by title
        const { data } = await supabase
            .from('products')
            .select('handle, id, title')
            .ilike('title', `%${query}%`)
            .limit(1)

        if (data && data.length > 0) {
            return Response.json({ success: true, handle: data[0].handle })
        }

        return Response.json({ success: false, error: 'Product not found' }, { status: 404 })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
