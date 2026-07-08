import { createClient } from '@supabase/supabase-js'

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

export async function GET(request) {
    try {
        const valid = await validateAdmin(request)
        if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const page = Math.max(1, Number(searchParams.get('page') || 1))
        const limit = 30
        const offset = (page - 1) * limit
        const queryText = String(searchParams.get('q') || '').trim()

        let query = supabase
            .from('customers')
            .select('id, first_name, last_name, phone, created_at, updated_at', { count: 'exact' })
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (queryText) {
            query = query.or('first_name.ilike.%' + queryText + '%,last_name.ilike.%' + queryText + '%,phone.ilike.%' + queryText + '%')
        }

        const { data, error, count } = await query
        if (error) return Response.json({ error: error.message }, { status: 500 })

        return Response.json({
            customers: data || [],
            total: count || 0,
            page,
            pageSize: limit,
        })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}
