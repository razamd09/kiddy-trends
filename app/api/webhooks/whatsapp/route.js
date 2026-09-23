import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

// WhatsApp and Instagram are products on the same Meta app, so the app
// secret and a verify token can be shared — falls back to the Instagram
// ones so nothing new has to be configured unless you want a separate value.
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || process.env.INSTAGRAM_APP_SECRET
const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token && token === VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
}

function verifySignature(rawBody, signatureHeader) {
    if (!APP_SECRET || !signatureHeader) return false
    const expected = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex')
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))
    } catch {
        return false
    }
}

async function processStatusEvent(status) {
    const error = Array.isArray(status?.errors) ? status.errors[0] : null
    await supabase.from('whatsapp_status_log').insert([{
        wa_message_id: status?.id || null,
        status: status?.status || null,
        recipient_id: status?.recipient_id || null,
        error_code: error?.code ? String(error.code) : null,
        error_title: error?.title || null,
        error_message: error?.message || error?.error_data?.details || null,
        raw_payload: status,
    }])
}

export async function POST(request) {
    const rawBody = await request.text()
    const signature = request.headers.get('x-hub-signature-256')
    const signatureValid = verifySignature(rawBody, signature)

    let payload
    try {
        payload = JSON.parse(rawBody)
    } catch {
        payload = { unparseable_raw_body: rawBody }
    }

    // Log every delivery attempt regardless of signature outcome — same
    // reasoning as the Instagram webhook: a silent signature mismatch should
    // never look identical to "nothing arrived at all".
    try {
        await supabase.from('whatsapp_status_log').insert([{
            status: '_webhook_received',
            raw_payload: { ...payload, _signatureValid: signatureValid },
        }])
    } catch (err) {
        console.log('WhatsApp webhook log error:', err)
    }

    if (!signatureValid) {
        return new Response('Invalid signature', { status: 401 })
    }

    try {
        const entries = Array.isArray(payload?.entry) ? payload.entry : []
        for (const entry of entries) {
            const changes = Array.isArray(entry.changes) ? entry.changes : []
            for (const change of changes) {
                const statuses = Array.isArray(change?.value?.statuses) ? change.value.statuses : []
                for (const status of statuses) {
                    await processStatusEvent(status)
                }
            }
        }
    } catch (err) {
        console.log('WhatsApp webhook processing error:', err)
    }

    return new Response('OK', { status: 200 })
}
