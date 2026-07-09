import {
    getCustomersPage,
    normalizeOrderSource,
    normalizePhone,
    upsertCustomers,
} from '../../admin/customers/customer-data'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = searchParams.get('page') || 1
        const queryText = searchParams.get('q') || ''

        const data = await getCustomersPage(page, queryText)
        return Response.json(data)
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}))
        const action = String(body?.action || '').trim()

        if (action !== 'add-customer') {
            return Response.json({ error: 'Unsupported action' }, { status: 400 })
        }

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
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}
