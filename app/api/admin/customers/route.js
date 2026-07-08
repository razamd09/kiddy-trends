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

function normalizePhone(value) {
    const raw = String(value || '').trim()
    if (!raw) return ''

    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('92')) return '+' + digits
    if (digits.startsWith('0')) return '+92' + digits.slice(1)
    if (digits.length === 10) return '+92' + digits
    return '+' + digits
}

function splitName(name) {
    const normalized = String(name || '').trim().replace(/\s+/g, ' ')
    if (!normalized) return { first_name: '', last_name: '' }
    const parts = normalized.split(' ')
    const firstName = parts.shift() || ''
    const lastName = parts.join(' ')
    return { first_name: firstName, last_name: lastName }
}

function normalizeCsvRow(row) {
    const firstName = String(row?.first_name || row?.firstName || row?.first || '').trim()
    const lastName = String(row?.last_name || row?.lastName || row?.last || '').trim()
    const phone = normalizePhone(row?.phone || row?.whatsapp || row?.mobile || '')
    if (!phone) return null
    return {
        first_name: firstName,
        last_name: lastName,
        phone,
        updated_at: new Date().toISOString(),
    }
}

async function buildCustomersFromOrders() {
    const pageSize = 1000
    let from = 0
    const byPhone = new Map()

    while (true) {
        const { data, error } = await supabase
            .from('orders')
            .select('customer_name, customer_phone, customer_whatsapp, created_at')
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1)

        if (error) throw new Error(error.message)
        if (!data || data.length === 0) break

        data.forEach((order) => {
            const phone = normalizePhone(order.customer_whatsapp || order.customer_phone || '')
            if (!phone || byPhone.has(phone)) return
            const name = splitName(order.customer_name)
            byPhone.set(phone, {
                ...name,
                phone,
                updated_at: new Date().toISOString(),
            })
        })

        if (data.length < pageSize) break
        from += pageSize
    }

    return [...byPhone.values()]
}

async function backfillCustomersFromOrders() {
    const rows = await buildCustomersFromOrders()
    if (rows.length === 0) return 0

    const { error } = await supabase
        .from('customers')
        .upsert(rows, { onConflict: 'phone' })

    if (error) throw new Error(error.message)
    return rows.length
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

        let { data, error, count } = await query
        if (error) return Response.json({ error: error.message }, { status: 500 })

        if (!queryText && page === 1 && (count || 0) === 0) {
            try {
                const imported = await backfillCustomersFromOrders()
                if (imported > 0) {
                    const refreshed = await supabase
                        .from('customers')
                        .select('id, first_name, last_name, phone, created_at, updated_at', { count: 'exact' })
                        .order('updated_at', { ascending: false })
                        .range(offset, offset + limit - 1)
                    data = refreshed.data || []
                    count = refreshed.count || 0
                }
            } catch {
                // Keep existing empty response if backfill fails.
            }
        }

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

export async function POST(request) {
    try {
        const valid = await validateAdmin(request)
        if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json().catch(() => ({}))
        const action = String(body?.action || '').trim()

        if (action === 'backfill-orders') {
            const imported = await backfillCustomersFromOrders()
            return Response.json({ success: true, imported, source: 'orders' })
        }

        if (action === 'import-csv') {
            const inputRows = Array.isArray(body?.rows) ? body.rows : []
            const byPhone = new Map()

            inputRows.forEach((raw) => {
                const row = normalizeCsvRow(raw)
                if (!row) return
                byPhone.set(row.phone, row)
            })

            const rows = [...byPhone.values()]
            if (rows.length === 0) {
                return Response.json({ success: true, imported: 0, source: 'csv' })
            }

            const { error } = await supabase
                .from('customers')
                .upsert(rows, { onConflict: 'phone' })

            if (error) return Response.json({ error: error.message }, { status: 500 })

            return Response.json({ success: true, imported: rows.length, source: 'csv' })
        }

        return Response.json({ error: 'Unsupported action' }, { status: 400 })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}
