import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const campaignNumber = Number(searchParams.get('campaign'))
    if (![1, 2, 3].includes(campaignNumber)) {
        return Response.json({ success: false, error: 'campaign must be 1, 2, or 3' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('campaign_slots')
        .select('product_id')
        .eq('campaign_number', campaignNumber)
        .order('position', { ascending: true })

    if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

    return Response.json(
        { success: true, productIds: (data || []).map((row) => row.product_id) },
        { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300' } }
    )
}
