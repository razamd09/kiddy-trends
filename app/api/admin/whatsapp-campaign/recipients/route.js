import { createClient } from '@supabase/supabase-js'
import { getCampaignRecipients } from '../../customers/customer-data'
import { CAMPAIGN_COOLDOWN_DAYS } from '../../../../../lib/whatsappApi'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

async function validateAdmin(request) {
    const token = request.headers.get('x-admin-token')
    if (!token) return false

    const { data: session } = await supabase
        .from('admin_sessions')
        .select('token')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single()

    return !!session
}

// Powers the customer picker on the WhatsApp Broadcast screen — same
// paginated/searchable/sortable shape as the Customers list, plus
// last_campaign_sent_at so the UI can gray out anyone still in the
// cooldown window instead of just hiding them.
export async function GET(request) {
    try {
        const valid = await validateAdmin(request)
        if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const data = await getCampaignRecipients(
            searchParams.get('page') || 1,
            searchParams.get('q') || '',
            searchParams.get('sort') || 'created_at',
            searchParams.get('dir') || 'desc',
            searchParams.get('source') || ''
        )
        return Response.json({ success: true, ...data, cooldownDays: CAMPAIGN_COOLDOWN_DAYS })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
