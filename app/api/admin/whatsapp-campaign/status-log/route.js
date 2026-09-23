import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function GET() {
    const { count } = await supabase
        .from('whatsapp_status_log')
        .select('id', { count: 'exact', head: true })

    const { data } = await supabase
        .from('whatsapp_status_log')
        .select('id, wa_message_id, status, recipient_id, error_code, error_title, error_message, received_at')
        .order('received_at', { ascending: false })
        .limit(15)

    return Response.json({ success: true, totalEvents: count || 0, recent: data || [] })
}
