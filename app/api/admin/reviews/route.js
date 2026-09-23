import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

async function requireAdmin(request) {
    const token = request.headers.get('x-admin-token')
    if (!token) return false

    const { data: session } = await supabase
        .from('admin_sessions')
        .select('token')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single()

    return Boolean(session)
}

export async function GET(request) {
    try {
        if (!(await requireAdmin(request))) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('product_reviews')
            .select('id, product_id, customer_name, rating, review_text, is_approved, created_at, products(title)')
            .order('created_at', { ascending: false })

        if (error) return Response.json({ error: error.message }, { status: 500 })

        return Response.json({ success: true, reviews: data || [] })
    } catch (error) {
        return Response.json({ error: error.message || 'Failed to load reviews' }, { status: 500 })
    }
}

export async function PATCH(request) {
    try {
        if (!(await requireAdmin(request))) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json().catch(() => ({}))
        const id = String(body?.id || '').trim()
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

        const { error } = await supabase
            .from('product_reviews')
            .update({ is_approved: Boolean(body?.is_approved) })
            .eq('id', id)

        if (error) return Response.json({ error: error.message }, { status: 500 })

        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ error: error.message || 'Failed to update review' }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        if (!(await requireAdmin(request))) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = String(searchParams.get('id') || '').trim()
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

        const { error } = await supabase
            .from('product_reviews')
            .delete()
            .eq('id', id)

        if (error) return Response.json({ error: error.message }, { status: 500 })

        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ error: error.message || 'Failed to delete review' }, { status: 500 })
    }
}
