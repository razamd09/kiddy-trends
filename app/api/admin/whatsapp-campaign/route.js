import { createClient } from '@supabase/supabase-js'
import { sendWhatsAppTemplate } from '../../../../lib/whatsappApi'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const SITE_URL = 'https://thekiddytrends.com'
const TEMPLATE_NAME = 'new_arrivals_broadcast_kt'
const PRODUCT_SLOTS = 5
const SEND_CONCURRENCY = 5

function cleanTitle(rawTitle) {
    return String(rawTitle || '')
        .replace(/^\s*#?\s*Kids\s+Affordable\s+Collection\s*(?:2026)?\s*[:\-]*\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 60)
}

async function fetchNewArrivalLines() {
    const { data, error } = await supabase
        .from('products')
        .select('id, title')
        .eq('is_active', true)
        .ilike('product_version', '%new arrival%')
        .order('created_at', { ascending: false })
        .limit(PRODUCT_SLOTS)

    if (error) throw new Error(error.message)

    const lines = (data || []).map((p) => cleanTitle(p.title) + ' – ' + SITE_URL + '/products/prd_id=' + p.id)

    // Template is approved with exactly PRODUCT_SLOTS variables — pad with a
    // safe filler on the rare chance there are fewer than that many active
    // New Arrivals (Meta rejects empty template parameters).
    while (lines.length < PRODUCT_SLOTS) {
        lines.push('✨ More new arrivals at ' + SITE_URL + '/collections')
    }

    return lines
}

// Preview: the 5 products this campaign will link to, plus how many
// customers it will reach — shown before the admin commits to sending.
export async function GET() {
    try {
        const productLines = await fetchNewArrivalLines()
        const { count, error } = await supabase
            .from('customers')
            .select('id', { count: 'exact', head: true })
            .not('phone', 'is', null)
            .neq('phone', '')

        if (error) throw new Error(error.message)

        return Response.json({ success: true, productLines, recipientCount: count || 0 })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}

// Sends one batch of the campaign, called repeatedly by the admin page with
// an increasing offset — keeps each request short instead of one giant send
// that risks a serverless timeout on a large customer list.
export async function POST(request) {
    try {
        const { offset = 0, limit = 40, productLines } = await request.json()

        if (!Array.isArray(productLines) || productLines.length === 0) {
            return Response.json({ success: false, error: 'productLines is required' }, { status: 400 })
        }

        const { data: customers, error } = await supabase
            .from('customers')
            .select('id, first_name, last_name, phone')
            .not('phone', 'is', null)
            .neq('phone', '')
            .order('id', { ascending: true })
            .range(offset, offset + limit - 1)

        if (error) throw new Error(error.message)

        let sent = 0
        let failed = 0
        const errors = []

        let idx = 0
        async function worker() {
            while (idx < customers.length) {
                const customer = customers[idx++]
                const name = String(customer.first_name || '').trim() || 'there'
                const result = await sendWhatsAppTemplate({
                    to: customer.phone,
                    templateName: TEMPLATE_NAME,
                    bodyParams: [name, ...productLines],
                })
                if (result.success) sent += 1
                else {
                    failed += 1
                    if (errors.length < 5) errors.push(result.error)
                }
            }
        }
        await Promise.all(Array.from({ length: Math.min(SEND_CONCURRENCY, customers.length) }, worker))

        return Response.json({
            success: true,
            processed: customers.length,
            sent,
            failed,
            errors,
            done: customers.length < limit,
        })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
