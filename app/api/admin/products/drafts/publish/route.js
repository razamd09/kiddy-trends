import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const DRAFT_SOURCE = 'draft_workspace'

export async function POST(request) {
    try {
        const body = await request.json()
        const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : []
        if (ids.length === 0) {
            return Response.json({ success: false, error: 'At least one draft id is required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('products')
            .update({
                source: 'custom',
                is_active: true,
                updated_at: new Date().toISOString(),
            })
            .in('id', ids)
            .eq('source', DRAFT_SOURCE)
            .select('id')

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

        const publishedIds = (data || []).map((item) => item.id)
        return Response.json({
            success: true,
            publishedCount: publishedIds.length,
            skippedCount: Math.max(0, ids.length - publishedIds.length),
            publishedIds,
        })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}

