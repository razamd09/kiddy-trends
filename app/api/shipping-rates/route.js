import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
    const { data, error } = await supabase
        .from('shipping_rates')
        .select('id, name, flat_price, shipping_percentage, is_active, updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)

    if (error) return Response.json({ error: error.message }, { status: 500 })

    if (!data || data.length === 0) {
        return Response.json({
            rate: {
                id: null,
                name: 'Default Shipping',
                flat_price: 250,
                shipping_percentage: 0,
                is_active: true,
            }
        })
    }

    return Response.json({ rate: data[0] })
}
