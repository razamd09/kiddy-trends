import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
        .from('discount_codes')
        .select('code, discount_type, discount_value, expiry_type, expiry_date')
        .eq('enabled', true)
        .or(`expiry_type.eq.unlimited,and(expiry_type.eq.limited,expiry_date.gt.${now})`)
        .order('created_at', { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ codes: data })
}
