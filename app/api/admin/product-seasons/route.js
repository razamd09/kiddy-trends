import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function GET() {
    const { data, error } = await supabase
        .from('product_seasons')
        .select('id, name, is_active, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ seasons: data || [] })
}