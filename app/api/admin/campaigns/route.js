import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function GET() {
    const { data, error } = await supabase
        .from('campaigns')
        .select('campaign_number, name, is_active')
        .order('campaign_number', { ascending: true })

    if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
    return Response.json({ success: true, campaigns: data || [] })
}

// Toggles (or renames) one campaign — never creates new rows, the 1-10 set
// is seeded once by migration.
export async function PUT(request) {
    try {
        const body = await request.json()
        const campaignNumber = Number(body.campaign_number)
        if (!Number.isInteger(campaignNumber) || campaignNumber < 1 || campaignNumber > 10) {
            return Response.json({ success: false, error: 'campaign_number must be between 1 and 10' }, { status: 400 })
        }

        const updates = { updated_at: new Date().toISOString() }
        if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)
        if (body.name !== undefined) {
            const name = String(body.name || '').trim()
            if (!name) return Response.json({ success: false, error: 'Name cannot be empty' }, { status: 400 })
            updates.name = name
        }

        const { data, error } = await supabase
            .from('campaigns')
            .update(updates)
            .eq('campaign_number', campaignNumber)
            .select('campaign_number, name, is_active')
            .single()

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
        return Response.json({ success: true, campaign: data })
    } catch (err) {
        return Response.json({ success: false, error: err.message || 'Invalid request' }, { status: 400 })
    }
}
