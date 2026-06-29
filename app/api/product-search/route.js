import { createClient } from '@supabase/supabase-js'

const DRAFT_SOURCE = 'draft_workspace'

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

        // Try by product ID first (if stored in order)
        if (productId && productId !== 'undefined') {
            const { data } = await supabase
                .from('products')
                .select('shopify_handle, id, title')
                .eq('id', productId)
                .eq('is_active', true)
                .or('source.is.null,source.neq.' + DRAFT_SOURCE)
                .single()

            if (data?.shopify_handle) {
                return Response.json({ success: true, handle: data.shopify_handle })
            }
        }

        // Search by title with multiple fallback strategies
        if (query) {
            // Strategy 1: Exact title match
            const { data: exactMatch } = await supabase
                .from('products')
                .select('shopify_handle, id, title')
                .ilike('title', `%${query}%`)
                .eq('is_active', true)
                .or('source.is.null,source.neq.' + DRAFT_SOURCE)
                .limit(1)

            if (exactMatch && exactMatch.length > 0 && exactMatch[0].shopify_handle) {
                return Response.json({ success: true, handle: exactMatch[0].shopify_handle })
            }

            // Strategy 2: Try with shortened query (first 50 chars)
            const shortQuery = query.substring(0, 50).trim()
            if (shortQuery !== query) {
                const { data: shortMatch } = await supabase
                    .from('products')
                    .select('shopify_handle, id, title')
                    .ilike('title', `%${shortQuery}%`)
                    .eq('is_active', true)
                    .or('source.is.null,source.neq.' + DRAFT_SOURCE)
                    .limit(1)

                if (shortMatch && shortMatch.length > 0 && shortMatch[0].shopify_handle) {
                    return Response.json({ success: true, handle: shortMatch[0].shopify_handle })
                }
            }

            // Strategy 3: Search with keywords (first 3 words)
            const keywords = query.split(' ').slice(0, 3).join(' ').trim()
            if (keywords && keywords !== query) {
                const { data: keywordMatch } = await supabase
                    .from('products')
                    .select('shopify_handle, id, title')
                    .ilike('title', `%${keywords}%`)
                    .eq('is_active', true)
                    .or('source.is.null,source.neq.' + DRAFT_SOURCE)
                    .limit(1)

                if (keywordMatch && keywordMatch.length > 0 && keywordMatch[0].shopify_handle) {
                    return Response.json({ success: true, handle: keywordMatch[0].shopify_handle })
                }
            }

            // Strategy 4: Search product_type as well
            const { data: typeMatch } = await supabase
                .from('products')
                .select('shopify_handle, id, title')
                .ilike('product_type', `%${keywords || query}%`)
                .eq('is_active', true)
                .or('source.is.null,source.neq.' + DRAFT_SOURCE)
                .limit(1)

            if (typeMatch && typeMatch.length > 0 && typeMatch[0].shopify_handle) {
                return Response.json({ success: true, handle: typeMatch[0].shopify_handle })
            }
        }

        return Response.json({ success: false, error: 'Product not found' }, { status: 404 })
    } catch (error) {
        console.error('Product search error:', error)
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}


