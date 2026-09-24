import { createClient } from '@supabase/supabase-js'
import {
    CAMPAIGN_BATCH_SIZE_MAX,
    CAMPAIGN_COOLDOWN_DAYS,
    sendWhatsAppTemplate,
    sendCarouselTemplate,
    sendVideoTemplate,
} from '../../../../lib/whatsappApi'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const TEMPLATE_NAME = 'new_arrivals_carousel_kt_10'
const VIDEO_TEMPLATE_NAME = 'single_video_promo_kt'
const PRODUCT_SLOTS = 10
const SEND_CONCURRENCY = 5

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
// admin can drag different ones in instead) — shown before committing.
export async function GET() {
    try {
        const defaultProductIds = await fetchDefaultProductIds()
        return Response.json({ success: true, defaultProductIds })
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

function isOnCooldown(customer) {
    if (!customer.last_campaign_sent_at) return false
    const cooldownMs = CAMPAIGN_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
    return Date.now() - new Date(customer.last_campaign_sent_at).getTime() < cooldownMs
}

// Sends one batch — called once per chunk the admin page splits its selected
// customerIds into (size chosen on the page, 5-20). `testNumbers` bypasses
// customerIds/cooldown entirely, for trying the message before a real send.
export async function POST(request) {
    try {
        const { customerIds, cards, video, testNumbers, debugTemplateName, recipientPool } = await request.json()
        const mode = video ? 'video' : 'carousel'
        const pool = recipientPool === 'non_kiddy' ? 'non_kiddy' : 'customers'
        const recipientTable = pool === 'non_kiddy' ? 'non_kiddy_contacts' : 'customers'

        // Debug-only override so a different, already-Active template (with
        // no variables of its own) can be used to sanity-check the send
        // pipeline while a new template is still in review.
        const templateName = debugTemplateName
            ? String(debugTemplateName).trim()
            : (mode === 'video' ? VIDEO_TEMPLATE_NAME : TEMPLATE_NAME)

        if (!debugTemplateName && mode === 'carousel' && (!Array.isArray(cards) || cards.length === 0)) {
            return Response.json({ success: false, error: 'cards is required' }, { status: 400 })
        }
        if (!debugTemplateName && mode === 'carousel' && cards.some((c) => !c.mediaId)) {
            return Response.json({ success: false, error: 'Every card needs an uploaded mediaId — upload images first' }, { status: 400 })
        }
        if (!debugTemplateName && mode === 'video' && !video.mediaId) {
            return Response.json({ success: false, error: 'Video needs an uploaded mediaId — upload the video first' }, { status: 400 })
        }
        if (!debugTemplateName && mode === 'video' && !String(video.tagline || '').trim()) {
            return Response.json({ success: false, error: 'A tagline is required' }, { status: 400 })
        }

        let recipients = []
        let skippedCooldown = 0
        const isTestSend = Array.isArray(testNumbers) && testNumbers.length > 0

        if (isTestSend) {
            recipients = testNumbers
                .map(normalizeTestNumber)
                .filter(Boolean)
                .map((phone) => ({ first_name: '', phone }))
        } else {
            const ids = Array.isArray(customerIds) ? customerIds.filter(Boolean) : []
            if (ids.length === 0) {
                return Response.json({ success: false, error: 'customerIds is required' }, { status: 400 })
            }
            if (ids.length > CAMPAIGN_BATCH_SIZE_MAX) {
                return Response.json({ success: false, error: 'A single batch can\'t exceed ' + CAMPAIGN_BATCH_SIZE_MAX + ' customers' }, { status: 400 })
            }

            const { data: customers, error } = await supabase
                .from(recipientTable)
                .select(pool === 'non_kiddy' ? 'id, name, phone, last_campaign_sent_at' : 'id, first_name, last_name, phone, last_campaign_sent_at')
                .in('id', ids)
                .not('phone', 'is', null)
                .neq('phone', '')

            if (error) throw new Error(error.message)

            // Re-checked fresh from the DB (not trusting whatever the picker
            // page had loaded) — this is what actually enforces the cooldown,
            // the UI graying-out is just a courtesy so it isn't a surprise here.
            for (const customer of customers || []) {
                if (isOnCooldown(customer)) skippedCooldown += 1
                else recipients.push(customer)
            }
        }

        let sent = 0
        let failed = 0
        const errors = []
        const successfulIds = []

        let idx = 0
        async function worker() {
            while (idx < recipients.length) {
                const recipient = recipients[idx++]
                // Non-Kiddy contacts only ever have a placeholder name (CP1,
                // CP2, ...) since real names can't be reliably matched to a
                // WhatsApp group's member list — never show that in an
                // outgoing greeting, use a generic "there" instead.
                const name = pool === 'non_kiddy' ? 'there' : (String(recipient.first_name || '').trim() || 'there')
                let result
                if (debugTemplateName) {
                    result = await sendWhatsAppTemplate({ to: recipient.phone, templateName, bodyParams: [] })
                } else if (mode === 'video') {
                    result = await sendVideoTemplate({
                        to: recipient.phone,
                        templateName,
                        mediaId: video.mediaId,
                        bodyParams: [video.tagline],
                        buttonUrlParam: video.buttonPath,
                    })
                } else {
                    result = await sendCarouselTemplate({
                        to: recipient.phone,
                        templateName,
                        bodyParams: [name],
                        cards: cards.map((c) => ({
                            mediaId: c.mediaId,
                            bodyParams: c.bodyText ? [c.bodyText] : [],
                            buttonUrlParam: c.buttonPath,
                        })),
                    })
                }
                if (result.success) {
                    sent += 1
                    if (recipient.id) successfulIds.push(recipient.id)
                } else {
                    failed += 1
                    if (errors.length < 5) errors.push(result.error)
                }
            }
        }
        await Promise.all(Array.from({ length: Math.min(SEND_CONCURRENCY, recipients.length) }, worker))

        if (!isTestSend && successfulIds.length > 0) {
            await supabase
                .from(recipientTable)
                .update({ last_campaign_sent_at: new Date().toISOString() })
                .in('id', successfulIds)
        }

        return Response.json({
            success: true,
            processed: recipients.length,
            sent,
            failed,
            skippedCooldown,
            errors,
            done: true,
        })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
