import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export const dynamic = 'force-dynamic'

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

// Non-Kiddy groups (e.g. "Central Park") — community/society contact lists
// kept fully separate from real order customers. Each has a short `prefix`
// used to auto-name contacts (CP1, CP2, ...) since names from a WhatsApp
// group member list can't be reliably matched to phone numbers.
export async function GET(request) {
    try {
        const valid = await validateAdmin(request)
        if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: groups, error } = await supabase
            .from('non_kiddy_groups')
            .select('*')
            .order('name')

        if (error) throw new Error(error.message)

        const { data: counts, error: countError } = await supabase
            .from('non_kiddy_contacts')
            .select('group_id')

        if (countError) throw new Error(countError.message)

        const countByGroup = {}
        for (const row of counts || []) {
            countByGroup[row.group_id] = (countByGroup[row.group_id] || 0) + 1
        }

        return Response.json({
            success: true,
            groups: (groups || []).map((g) => ({ ...g, contactCount: countByGroup[g.id] || 0 })),
        })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const valid = await validateAdmin(request)
        if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const { name, prefix } = await request.json()
        const cleanName = String(name || '').trim()
        const cleanPrefix = String(prefix || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
        if (!cleanName) return Response.json({ success: false, error: 'Name is required' }, { status: 400 })
        if (!cleanPrefix) return Response.json({ success: false, error: 'Prefix is required (e.g. CP)' }, { status: 400 })

        const { data, error } = await supabase
            .from('non_kiddy_groups')
            .insert([{ name: cleanName, prefix: cleanPrefix }])
            .select()
            .single()

        if (error) throw new Error(error.message)
        return Response.json({ success: true, group: data })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const valid = await validateAdmin(request)
        if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return Response.json({ success: false, error: 'id is required' }, { status: 400 })

        const { error } = await supabase.from('non_kiddy_groups').delete().eq('id', id)
        if (error) throw new Error(error.message)
        return Response.json({ success: true })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
