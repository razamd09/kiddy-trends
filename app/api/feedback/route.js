import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
    const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ feedback: data })
}

export async function POST(request) {
    try {
        const body = await request.json()
        const { data, error } = await supabase
            .from('feedback')
            .insert([{
                customer_name:          body.customer_name || 'Anonymous',
                customer_phone:         body.customer_phone || '',
                overall_experience:     body.overall_experience,
                representative_service: body.representative_service,
                size_accuracy:          body.size_accuracy,
                product_quality:        body.product_quality,
                response_time:          body.response_time,
                comments:               body.comments || '',
            }])
            .select()
            .single()
        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, feedback: data })
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 })
    }
}