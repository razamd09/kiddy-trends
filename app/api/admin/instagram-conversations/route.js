import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').trim()
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200)

    let query = supabase
        .from('instagram_conversations')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(limit)

    if (search) {
        query = query.or('username.ilike.%' + search + '%,display_name.ilike.%' + search + '%')
    }

    const { data, error } = await query
    if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
    return Response.json({ success: true, conversations: data || [] })
}
