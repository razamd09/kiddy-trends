import {
    getCustomersPage,
    normalizeOrderSource,
    normalizePhone,
    sendPromotionEmailToAllCustomers,
    upsertCustomers,
} from '../../admin/customers/customer-data'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

async function validateEmployeeAccess(employeeId) {
    const id = String(employeeId || '').trim()
    if (!id) return false

    const { data } = await supabase
        .from('employees')
        .select('employee_id, role, is_active')
        .eq('employee_id', id)
        .eq('is_active', true)
        .single()

    return !!data && (data.role === 'employee' || data.role === 'admin')
}

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

        if (action === 'send-promotions-email') {
            const validEmployee = await validateEmployeeAccess(body?.employee_id)
            if (!validEmployee) return Response.json({ error: 'Unauthorized' }, { status: 401 })

            const subject = String(body?.subject || '').trim()
            if (!subject) return Response.json({ error: 'Subject is required' }, { status: 400 })

            const result = await sendPromotionEmailToAllCustomers(subject)
            return Response.json({ success: true, ...result })
        }

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
