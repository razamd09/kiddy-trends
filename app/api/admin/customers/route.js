import { createClient } from '@supabase/supabase-js'
import {
    backfillCustomersFromOrders,
    getCustomersPage,
    normalizeCsvRow,
    normalizeOrderSource,
    normalizePhone,
    sendPromotionEmailToAllCustomers,
    sendPromotionWhatsAppToAllCustomers,
    upsertCustomers,
} from './customer-data'

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
        const data = await getCustomersPage(searchParams.get('page') || 1, searchParams.get('q') || '')
        return Response.json(data)
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

            const error = await upsertCustomers(rows)

            if (error) return Response.json({ error: error.message }, { status: 500 })

            return Response.json({ success: true, imported: rows.length, source: 'csv' })
        }

        if (action === 'send-promotions-email') {
            const subject = String(body?.subject || '').trim()
            if (!subject) return Response.json({ error: 'Subject is required' }, { status: 400 })

            const result = await sendPromotionEmailToAllCustomers(subject)
            return Response.json({ success: true, ...result })
        }

        if (action === 'send-promotions-whatsapp') {
            const subject = String(body?.subject || '').trim()
            if (!subject) return Response.json({ error: 'Subject is required' }, { status: 400 })

            const result = await sendPromotionWhatsAppToAllCustomers(subject)
            return Response.json({ success: true, ...result })
        }

        if (action === 'add-customer') {
            const first_name = String(body?.first_name || body?.firstName || '').trim()
            const last_name = String(body?.last_name || body?.lastName || '').trim()
            const phone = normalizePhone(body?.phone || '')
            const order_source = normalizeOrderSource(body?.order_source || body?.orderSource)

            if (!phone) {
                return Response.json({ error: 'Valid phone is required' }, { status: 400 })
            }

            const error = await upsertCustomers([{
                    first_name,
                    last_name,
                    phone,
                    order_source,
                    updated_at: new Date().toISOString(),
                }])

            if (error) return Response.json({ error: error.message }, { status: 500 })
            return Response.json({ success: true, source: 'manual' })
        }

        return Response.json({ error: 'Unsupported action' }, { status: 400 })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}
