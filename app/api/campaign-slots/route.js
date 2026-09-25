import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const campaignNumber = Number(searchParams.get('campaign'))
    if (!Number.isInteger(campaignNumber) || campaignNumber < 1 || campaignNumber > 10) {
        return Response.json({ success: false, error: 'campaign must be between 1 and 10' }, { status: 400 })
    }

    const { data: campaign } = await supabase
        .from('campaigns')
        .select('is_active')
        .eq('campaign_number', campaignNumber)
        .maybeSingle()

    // Unknown campaign numbers (no row yet) behave the same as inactive —
    // the page should 404, not silently render an empty campaign.
    const active = campaign?.is_active === true
    if (!active) {
        return Response.json(
            { success: true, active: false, productIds: [] },
            { headers: { 'Cache-Control': 'no-store' } }
        )
    }

    const { data, error } = await supabase
        .from('campaign_slots')
        .select('product_id')
        .eq('campaign_number', campaignNumber)
        .order('position', { ascending: true })

    if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

    return Response.json(
        { success: true, active: true, productIds: (data || []).map((row) => row.product_id) },
        { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300' } }
    )
}
