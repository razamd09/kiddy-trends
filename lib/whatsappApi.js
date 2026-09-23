// WhatsApp Business Cloud API client — real server-to-customer message sends,
// replacing the manual "click wa.me and press send yourself" flow.
//
// Setup required in Meta Business Manager before this does anything (see
// WHATSAPP_SETUP.md at the repo root for the full walkthrough):
//   WHATSAPP_ACCESS_TOKEN       - permanent system-user token with whatsapp_business_messaging
//   WHATSAPP_PHONE_NUMBER_ID    - the registered sender number's Phone Number ID
//   WHATSAPP_API_VERSION        - optional, defaults below
//
// Business-initiated messages (anything sent outside a 24h window since the
// customer's last message) MUST use a pre-approved message template — free-form
// text is only allowed as a reply within that window. Every send here is a
// template send for that reason.

const GRAPH_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0'

function isConfigured() {
    return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
}

// Same Pakistan-number convention used elsewhere in the app (normalizePhone in
// customer-data.js), just returned as bare digits — the Cloud API's `to` field
// wants "923001234567", no leading "+".
function toWhatsAppDigits(value) {
    const raw = String(value || '').trim()
    if (!raw) return ''
    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('92')) return digits
    if (digits.startsWith('0')) return '92' + digits.slice(1)
    if (digits.length === 10) return '92' + digits
    return digits
}

// `bodyParams` fills the approved template's {{1}}, {{2}}... placeholders in
// order. `languageCode` must match the language the template was approved in —
// defaults to plain "en" since that's what Meta's template editor picks
// unless "English (US)" is explicitly selected instead.
export async function sendWhatsAppTemplate({ to, templateName, bodyParams = [], languageCode = 'en' }) {
    if (!isConfigured()) {
        return { success: false, error: 'WhatsApp Cloud API not configured (missing WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID)' }
    }

    const toDigits = toWhatsAppDigits(to)
    if (!toDigits) {
        return { success: false, error: 'No valid recipient phone number' }
    }

    const payload = {
        messaging_product: 'whatsapp',
        to: toDigits,
        type: 'template',
        template: {
            name: templateName,
            language: { code: languageCode },
            components: bodyParams.length > 0
                ? [{ type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text: String(text) })) }]
                : [],
        },
    }

    try {
        const res = await fetch(
            'https://graph.facebook.com/' + GRAPH_API_VERSION + '/' + process.env.WHATSAPP_PHONE_NUMBER_ID + '/messages',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + process.env.WHATSAPP_ACCESS_TOKEN,
                },
                body: JSON.stringify(payload),
            }
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            return { success: false, error: data?.error?.message || ('WhatsApp API error ' + res.status) }
        }
        return { success: true, messageId: data?.messages?.[0]?.id || null }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

// Uploads an image (fetched from our own site) to WhatsApp's Media API so it
// can be used as a carousel card header — Cloud API does not accept a plain
// public image URL for template sends, only a pre-uploaded media id. The
// resulting id is reusable across every recipient in a campaign (upload once
// per launch, not once per customer) but expires after 30 days per Meta's docs.
export async function uploadWhatsAppMedia(imageUrl) {
    if (!isConfigured()) {
        return { success: false, error: 'WhatsApp Cloud API not configured' }
    }
    try {
        const imgRes = await fetch(imageUrl)
        if (!imgRes.ok) return { success: false, error: 'Failed to fetch image (' + imgRes.status + ')' }
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
        const buffer = await imgRes.arrayBuffer()

        const form = new FormData()
        form.append('messaging_product', 'whatsapp')
        form.append('type', contentType)
        form.append('file', new Blob([buffer], { type: contentType }), 'card.jpg')

        const res = await fetch(
            'https://graph.facebook.com/' + GRAPH_API_VERSION + '/' + process.env.WHATSAPP_PHONE_NUMBER_ID + '/media',
            {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + process.env.WHATSAPP_ACCESS_TOKEN },
                body: form,
            }
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.id) {
            return { success: false, error: data?.error?.message || ('Media upload failed (' + res.status + ')') }
        }
        return { success: true, mediaId: data.id }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

// Sends a Carousel Template — an intro body plus up to 10 swipeable cards,
// each with an uploaded image, its own short body text, and one URL button.
// `cards`: [{ mediaId, bodyParams: [...], buttonUrlParam }]
export async function sendCarouselTemplate({ to, templateName, languageCode = 'en', bodyParams = [], cards }) {
    if (!isConfigured()) {
        return { success: false, error: 'WhatsApp Cloud API not configured' }
    }
    const toDigits = toWhatsAppDigits(to)
    if (!toDigits) {
        return { success: false, error: 'No valid recipient phone number' }
    }

    const components = []
    if (bodyParams.length > 0) {
        components.push({ type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text: String(text) })) })
    }
    components.push({
        type: 'carousel',
        cards: (cards || []).map((card, index) => {
            const cardComponents = [
                { type: 'header', parameters: [{ type: 'image', image: { id: card.mediaId } }] },
            ]
            if (card.bodyParams?.length) {
                cardComponents.push({ type: 'body', parameters: card.bodyParams.map((t) => ({ type: 'text', text: String(t) })) })
            }
            if (card.buttonUrlParam) {
                cardComponents.push({ type: 'button', sub_type: 'url', index: 0, parameters: [{ type: 'text', text: card.buttonUrlParam }] })
            }
            return { card_index: index, components: cardComponents }
        }),
    })

    const payload = {
        messaging_product: 'whatsapp',
        to: toDigits,
        type: 'template',
        template: { name: templateName, language: { code: languageCode }, components },
    }

    try {
        const res = await fetch(
            'https://graph.facebook.com/' + GRAPH_API_VERSION + '/' + process.env.WHATSAPP_PHONE_NUMBER_ID + '/messages',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + process.env.WHATSAPP_ACCESS_TOKEN,
                },
                body: JSON.stringify(payload),
            }
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            return { success: false, error: data?.error?.message || ('WhatsApp API error ' + res.status) }
        }
        return { success: true, messageId: data?.messages?.[0]?.id || null }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

// Order-status -> approved template name. These must be created and approved
// in Meta Business Manager (WhatsApp Manager > Message Templates) under the
// UTILITY category with these exact bodies before sends will succeed — see
// WHATSAPP_SETUP.md. {{1}} = first name, {{2}} = order number.
export const ORDER_STATUS_TEMPLATES = {
    pending:    'order_pending_kt',
    processing: 'order_processing_kt',
    dispatched: 'order_dispatched_kt',
    delivered:  'order_delivered_kt',
    cancelled:  'order_cancelled_kt',
}

export async function sendOrderStatusWhatsApp(order, status) {
    const templateName = ORDER_STATUS_TEMPLATES[status]
    if (!templateName) return { success: false, error: 'No template mapped for status ' + status }

    const to = order.customer_whatsapp || order.customer_phone
    const name = String(order.customer_name || '').trim().split(' ')[0] || 'there'
    const orderNumber = order.order_number || ('#' + order.id)

    return sendWhatsAppTemplate({
        to,
        templateName,
        bodyParams: [name, orderNumber],
    })
}
