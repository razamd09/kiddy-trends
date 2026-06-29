import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
    try {
        const { code } = await request.json()

        if (!code || typeof code !== 'string') {
            return Response.json({ error: 'Code is required' }, { status: 400 })
        }

        const now = new Date().toISOString()

        const { data, error } = await supabase
            .from('discount_codes')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('enabled', true)
            .or(`expiry_type.eq.unlimited,and(expiry_type.eq.limited,expiry_date.gt.${now})`)
            .single()

        if (error || !data) {
            return Response.json(
                { error: 'Invalid or expired discount code' },
                { status: 404 }
            )
        }

        // Check if code has reached max usage
        if (data.max_usage && data.usage_count >= data.max_usage) {
            return Response.json(
                { error: 'This discount code has reached its usage limit' },
                { status: 400 }
            )
        }

        return Response.json({
            success: true,
            code: data.code,
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            expiry_date: data.expiry_date
        })
    } catch (err) {
        console.error('Discount validation error:', err)
        return Response.json({ error: 'Error validating code' }, { status: 500 })
    }
}
