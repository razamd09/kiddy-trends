import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    if (!conversationId) {
        return Response.json({ success: false, error: 'conversationId is required' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('instagram_messages')
        .select('id, direction, message_text, sent_at')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true })

    if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
    return Response.json({ success: true, messages: data || [] })
}
