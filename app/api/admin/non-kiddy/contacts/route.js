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

// Not Pakistan-specific like the real customers' normalizePhone — this list
// carries real international numbers as-is (Gulf/UK/etc. diaspora members
// show up in community groups), just cleaned of whitespace/formatting.
function normalizeInternationalPhone(value) {
    const raw = String(value || '').trim()
    if (!raw) return ''
    const digits = raw.replace(/[^\d+]/g, '')
    if (!digits) return ''
    return digits.startsWith('+') ? digits : '+' + digits
}

export async function GET(request) {
    try {
        const valid = await validateAdmin(request)
        if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const page = Math.max(1, Number(searchParams.get('page') || 1))
        const limit = 30
        const offset = (page - 1) * limit
        const groupId = searchParams.get('groupId')
        const search = String(searchParams.get('q') || '').trim()

        let query = supabase
            .from('non_kiddy_contacts')
            .select('*, non_kiddy_groups(name, prefix)', { count: 'exact' })
            .order('id', { ascending: false })
            .range(offset, offset + limit - 1)

        if (groupId) query = query.eq('group_id', groupId)
        if (search) query = query.or('name.ilike.%' + search + '%,phone.ilike.%' + search + '%')

        const { data, error, count } = await query
        if (error) throw new Error(error.message)

        return Response.json({ success: true, contacts: data || [], total: count || 0, page })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}

// Bulk import — `rows`: [{name, phone}], name optional (falls back to the
// group's prefix + a running number, e.g. CP483, continuing from whatever's
// already in the group rather than restarting at 1).
export async function POST(request) {
    try {
        const valid = await validateAdmin(request)
        if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const { groupId, rows } = await request.json()
        if (!groupId) return Response.json({ success: false, error: 'groupId is required' }, { status: 400 })
        if (!Array.isArray(rows) || rows.length === 0) {
            return Response.json({ success: false, error: 'rows is required' }, { status: 400 })
        }

        const { data: group, error: groupError } = await supabase
            .from('non_kiddy_groups')
            .select('id, prefix')
            .eq('id', groupId)
            .single()
        if (groupError || !group) return Response.json({ success: false, error: 'Group not found' }, { status: 404 })

        const { count: existingCount } = await supabase
            .from('non_kiddy_contacts')
            .select('id', { count: 'exact', head: true })
            .eq('group_id', groupId)

        let nextSeq = (existingCount || 0) + 1
        const byPhone = new Map()
        for (const row of rows) {
            const phone = normalizeInternationalPhone(row?.phone)
            if (!phone || byPhone.has(phone)) continue
            const name = String(row?.name || '').trim() || (group.prefix + nextSeq)
            if (!row?.name) nextSeq += 1
            byPhone.set(phone, { group_id: groupId, name, phone })
        }

        const insertRows = [...byPhone.values()]
        if (insertRows.length === 0) return Response.json({ success: true, imported: 0 })

        const { error } = await supabase
            .from('non_kiddy_contacts')
            .upsert(insertRows, { onConflict: 'group_id,phone' })

        if (error) throw new Error(error.message)
        return Response.json({ success: true, imported: insertRows.length })
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

        const { error } = await supabase.from('non_kiddy_contacts').delete().eq('id', id)
        if (error) throw new Error(error.message)
        return Response.json({ success: true })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
