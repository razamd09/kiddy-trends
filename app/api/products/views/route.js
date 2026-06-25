import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
    const { product_id } = await request.json()
    // Use upsert to increment view count
    const { data: existing } = await supabase
        .from('product_views')
        .select('views')
        .eq('product_id', String(product_id))
        .single()

    if (existing) {
        await supabase
            .from('product_views')
            .update({ views: existing.views + 1 })
            .eq('product_id', String(product_id))
        return Response.json({ views: existing.views + 1 })
    } else {
        await supabase
            .from('product_views')
            .insert([{ product_id: String(product_id), views: 1 }])
        return Response.json({ views: 1 })
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const product_id = searchParams.get('product_id')
    const { data } = await supabase
        .from('product_views')
        .select('views')
        .eq('product_id', String(product_id))
        .single()
    return Response.json({ views: data?.views || 0 })
}