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

import sharp from 'sharp'

const GRAPH_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0'

// Minimum days between two broadcast campaign messages to the same
// customer, enforced globally across every campaign (not per-campaign) —
// shared by the recipients picker (to gray out ineligible customers) and
// the send route (to re-check before each send).
export const CAMPAIGN_COOLDOWN_DAYS = 5
export const CAMPAIGN_BATCH_SIZE_MIN = 5
export const CAMPAIGN_BATCH_SIZE_MAX = 20

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
        const sourceBuffer = Buffer.from(await imgRes.arrayBuffer())

        // Product images are stored as WEBP. WhatsApp's Media API will
        // accept a WEBP upload and hand back a media id (so this looks fine
        // at upload time), but template/carousel header images only render
        // JPEG or PNG — using that id in a template send fails later with
        // error 131053 "Media upload error". Always transcode to JPEG here
        // so the media is valid regardless of what format it was stored in.
        const buffer = await sharp(sourceBuffer).jpeg({ quality: 85 }).toBuffer()
        const contentType = 'image/jpeg'

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

// Uploads a video (fetched from our own Storage) to WhatsApp's Media API for
// use as a single-video template's header. WhatsApp only accepts MP4 or
// 3GPP for outbound video messages — unlike uploadWhatsAppMedia for images,
// this does not transcode (no video equivalent of sharp available here), so
// the source must already be MP4.
export async function uploadWhatsAppVideoMedia(videoUrl) {
    if (!isConfigured()) {
        return { success: false, error: 'WhatsApp Cloud API not configured' }
    }
    try {
        const videoRes = await fetch(videoUrl)
        if (!videoRes.ok) return { success: false, error: 'Failed to fetch video (' + videoRes.status + ')' }
        const buffer = Buffer.from(await videoRes.arrayBuffer())
        const contentType = 'video/mp4'

        const form = new FormData()
        form.append('messaging_product', 'whatsapp')
        form.append('type', contentType)
        form.append('file', new Blob([buffer], { type: contentType }), 'promo.mp4')

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
            return { success: false, error: data?.error?.message || ('Video upload failed (' + res.status + ')') }
        }
        return { success: true, mediaId: data.id }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

// Sends a single-video promo template — one header video, one body (name +
// a short admin-provided tagline), one URL button. `buttonUrlParam` is the
// path suffix appended to whatever base URL the approved template's button
// was created with (same pattern as sendCarouselTemplate's per-card button).
export async function sendVideoTemplate({ to, templateName, languageCode = 'en', bodyParams = [], mediaId, buttonUrlParam }) {
    if (!isConfigured()) {
        return { success: false, error: 'WhatsApp Cloud API not configured' }
    }
    const toDigits = toWhatsAppDigits(to)
    if (!toDigits) {
        return { success: false, error: 'No valid recipient phone number' }
    }

    const components = [
        { type: 'header', parameters: [{ type: 'video', video: { id: mediaId } }] },
    ]
    if (bodyParams.length > 0) {
        components.push({ type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text: String(text) })) })
    }
    if (buttonUrlParam) {
        components.push({ type: 'button', sub_type: 'url', index: 0, parameters: [{ type: 'text', text: buttonUrlParam }] })
    }

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

// --- One-time template creation (Carousel templates aren't offered in this
// account's Manage Templates UI at all — only creatable directly via the API). ---

// Template creation needs a sample media "handle" per the Resumable Upload
// API — a different, two-step upload flow from the plain Media API used to
// upload real send-time images. This handle is only used for Meta's review
// preview; the real per-recipient images at send time go through
// uploadWhatsAppMedia/sendCarouselTemplate above instead.
async function uploadTemplateMediaHandle(imageUrl) {
    if (!process.env.WHATSAPP_APP_ID) {
        return { success: false, error: 'WHATSAPP_APP_ID is not configured' }
    }
    try {
        const imgRes = await fetch(imageUrl)
        if (!imgRes.ok) return { success: false, error: 'Failed to fetch sample image (' + imgRes.status + ')' }
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
        const buffer = Buffer.from(await imgRes.arrayBuffer())

        const startRes = await fetch(
            'https://graph.facebook.com/' + GRAPH_API_VERSION + '/' + process.env.WHATSAPP_APP_ID + '/uploads'
            + '?file_name=sample.jpg&file_length=' + buffer.length + '&file_type=' + encodeURIComponent(contentType)
            + '&access_token=' + process.env.WHATSAPP_ACCESS_TOKEN,
            { method: 'POST' }
        )
        const startData = await startRes.json().catch(() => ({}))
        if (!startRes.ok || !startData.id) {
            return { success: false, error: startData?.error?.message || 'Failed to start upload session' }
        }

        const uploadRes = await fetch(
            'https://graph.facebook.com/' + GRAPH_API_VERSION + '/' + startData.id,
            {
                method: 'POST',
                headers: {
                    Authorization: 'OAuth ' + process.env.WHATSAPP_ACCESS_TOKEN,
                    file_offset: '0',
                },
                body: buffer,
            }
        )
        const uploadData = await uploadRes.json().catch(() => ({}))
        if (!uploadRes.ok || !uploadData.h) {
            return { success: false, error: uploadData?.error?.message || 'Failed to upload sample media bytes' }
        }
        return { success: true, handle: uploadData.h }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

// Creates the new_arrivals_carousel_kt Marketing template — a one-time setup
// call, not part of the regular send flow. `cardCount` cards, all identical
// in structure (Meta requires this): image header, one body variable, one
// URL button with a variable suffix appended to `buttonBaseUrl`.
export async function createCarouselTemplate({
    name, languageCode = 'en', bodyText, bodyExample,
    cardCount, cardBodyText = '🛍️ Now available: {{1}}', cardBodyExample, buttonBaseUrl, buttonExample, sampleImageUrl,
}) {
    if (!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) {
        return { success: false, error: 'WHATSAPP_BUSINESS_ACCOUNT_ID is not configured' }
    }

    const handleResult = await uploadTemplateMediaHandle(sampleImageUrl)
    if (!handleResult.success) return handleResult

    const card = {
        components: [
            { type: 'header', format: 'image', example: { header_handle: [handleResult.handle] } },
            { type: 'body', text: cardBodyText, example: { body_text: [[cardBodyExample]] } },
            {
                type: 'buttons',
                buttons: [
                    { type: 'url', text: 'View Product', url: buttonBaseUrl + '{{1}}', example: [buttonBaseUrl + buttonExample] },
                ],
            },
        ],
    }

    const payload = {
        name,
        language: languageCode,
        category: 'MARKETING',
        components: [
            { type: 'body', text: bodyText, example: { body_text: [[bodyExample]] } },
            { type: 'carousel', cards: Array.from({ length: cardCount }, () => card) },
        ],
    }

    try {
        const res = await fetch(
            'https://graph.facebook.com/' + GRAPH_API_VERSION + '/' + process.env.WHATSAPP_BUSINESS_ACCOUNT_ID + '/message_templates',
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
            return { success: false, error: data?.error?.message || ('Template creation failed (' + res.status + ')'), raw: data }
        }
        return { success: true, data }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

// Creates a single-video promo Marketing template — one-time setup call, not
// part of the regular send flow. Body's only variable is the admin-provided
// tagline, deliberately kept short relative to the surrounding static text:
// Meta rejects a template whose variable makes up too much of the message
// ("too many variables for its length"), so this only works if the tagline
// stays a short headline, not a paragraph.
export async function createVideoTemplate({
    name, languageCode = 'en', bodyText, bodyExample,
    buttonBaseUrl, buttonExample, sampleVideoUrl,
}) {
    if (!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) {
        return { success: false, error: 'WHATSAPP_BUSINESS_ACCOUNT_ID is not configured' }
    }

    const handleResult = await uploadTemplateMediaHandle(sampleVideoUrl)
    if (!handleResult.success) return handleResult

    const payload = {
        name,
        language: languageCode,
        category: 'MARKETING',
        components: [
            { type: 'header', format: 'video', example: { header_handle: [handleResult.handle] } },
            { type: 'body', text: bodyText, example: { body_text: [[bodyExample]] } },
            {
                type: 'buttons',
                buttons: [
                    { type: 'url', text: 'Shop Now', url: buttonBaseUrl + '{{1}}', example: [buttonBaseUrl + buttonExample] },
                ],
            },
        ],
    }

    try {
        const res = await fetch(
            'https://graph.facebook.com/' + GRAPH_API_VERSION + '/' + process.env.WHATSAPP_BUSINESS_ACCOUNT_ID + '/message_templates',
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
            return { success: false, error: data?.error?.message || ('Template creation failed (' + res.status + ')'), raw: data }
        }
        return { success: true, data }
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
