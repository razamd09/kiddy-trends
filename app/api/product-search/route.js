import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        let query = (searchParams.get('q') || '').trim()
        const productId = searchParams.get('id') || ''

        if (!query && !productId) {
            return Response.json({ success: false, error: 'Missing search query or product ID' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )

        // Search by product ID first
        if (productId && productId !== 'undefined') {
            const { data } = await supabase
                .from('products')
                .select('handle, id, title')
                .eq('id', parseInt(productId))
                .single()

            if (data?.handle) {
                return Response.json({ success: true, handle: data.handle })
            }
        }

        // Fallback: search by title (more flexible search)
        if (query) {
            // Try exact/full match first
            let { data } = await supabase
                .from('products')
                .select('handle, id, title')
                .ilike('title', `%${query}%`)
                .limit(5)

            if (data && data.length > 0) {
                return Response.json({ success: true, handle: data[0].handle })
            }

            // Try with first 50 characters if title is very long
            const shortQuery = query.substring(0, 50).trim()
            if (shortQuery !== query) {
                const { data: shortData } = await supabase
                    .from('products')
                    .select('handle, id, title')
                    .ilike('title', `%${shortQuery}%`)
                    .limit(5)

                if (shortData && shortData.length > 0) {
                    return Response.json({ success: true, handle: shortData[0].handle })
                }
            }

            // Try searching for keywords (split by space and search for first few words)
            const keywords = query.split(' ').slice(0, 3).join(' ')
            if (keywords !== query) {
                const { data: keywordData } = await supabase
                    .from('products')
                    .select('handle, id, title')
                    .ilike('title', `%${keywords}%`)
                    .limit(5)

                if (keywordData && keywordData.length > 0) {
                    return Response.json({ success: true, handle: keywordData[0].handle })
                }
            }
        }

        return Response.json({ success: false, error: 'Product not found' }, { status: 404 })
    } catch (error) {
        console.error('Product search error:', error)
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}

