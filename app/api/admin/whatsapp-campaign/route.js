import { createClient } from '@supabase/supabase-js'
import { sendWhatsAppTemplate } from '../../../../lib/whatsappApi'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const TEMPLATE_NAME = 'new_arrivals_broadcast_kt'
const PRODUCT_SLOTS = 5
const SEND_CONCURRENCY = 5
const BATCH_DEFAULT = 100

async function fetchDefaultProductIds() {
    const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('is_active', true)
        .ilike('product_version', '%new arrival%')
        .order('created_at', { ascending: false })
        .limit(PRODUCT_SLOTS)

    if (error) throw new Error(error.message)
    return (data || []).map((p) => p.id)
}

// Preview: which products default-select into the 5 broadcast slots (the
// admin can drag different ones in instead), plus how many customers this
// would reach — shown before committing to a send.
export async function GET() {
    try {
        const defaultProductIds = await fetchDefaultProductIds()
        const { count, error } = await supabase
            .from('customers')
            .select('id', { count: 'exact', head: true })
            .not('phone', 'is', null)
            .neq('phone', '')

        if (error) throw new Error(error.message)

        return Response.json({ success: true, defaultProductIds, recipientCount: count || 0 })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}

function normalizeTestNumber(value) {
    const digits = String(value || '').replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('92')) return digits
    if (digits.startsWith('0')) return '92' + digits.slice(1)
    if (digits.length === 10) return '92' + digits
    return digits
}

// Sends one batch of the campaign, called repeatedly by the admin page with
// an increasing offset — keeps each request short instead of one giant send
// that risks a serverless timeout on a large customer list. When
// `testNumbers` is given, it sends only to those numbers instead of paging
// through the customers table, so a campaign can be checked before launch.
export async function POST(request) {
    try {
        const { offset = 0, limit = BATCH_DEFAULT, productLines, testNumbers, debugTemplateName } = await request.json()

        // Debug-only override so a different, already-Active template (with
        // no variables of its own) can be used to sanity-check the send
        // pipeline while new_arrivals_broadcast_kt is still in review.
        const templateName = debugTemplateName ? String(debugTemplateName).trim() : TEMPLATE_NAME

        if (!debugTemplateName && (!Array.isArray(productLines) || productLines.length === 0)) {
            return Response.json({ success: false, error: 'productLines is required' }, { status: 400 })
        }

        let recipients
        let isLastBatch

        if (Array.isArray(testNumbers) && testNumbers.length > 0) {
            recipients = testNumbers
                .map(normalizeTestNumber)
                .filter(Boolean)
                .map((phone) => ({ first_name: '', phone }))
            isLastBatch = true
        } else {
            const { data: customers, error } = await supabase
                .from('customers')
                .select('id, first_name, last_name, phone')
                .not('phone', 'is', null)
                .neq('phone', '')
                .order('id', { ascending: true })
                .range(offset, offset + limit - 1)

            if (error) throw new Error(error.message)
            recipients = customers || []
            isLastBatch = recipients.length < limit
        }

        let sent = 0
        let failed = 0
        const errors = []

        let idx = 0
        async function worker() {
            while (idx < recipients.length) {
                const recipient = recipients[idx++]
                const name = String(recipient.first_name || '').trim() || 'there'
                const result = await sendWhatsAppTemplate({
                    to: recipient.phone,
                    templateName,
                    bodyParams: debugTemplateName ? [] : [name, ...productLines],
                })
                if (result.success) sent += 1
                else {
                    failed += 1
                    if (errors.length < 5) errors.push(result.error)
                }
            }
        }
        await Promise.all(Array.from({ length: Math.min(SEND_CONCURRENCY, recipients.length) }, worker))

        return Response.json({
            success: true,
            processed: recipients.length,
            sent,
            failed,
            errors,
            done: isLastBatch,
        })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
