import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

// One-time handshake Meta does when you save the webhook subscription in the
// app dashboard — echo back hub.challenge if our verify token matches.
export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
}

function verifySignature(rawBody, signatureHeader) {
    if (!process.env.INSTAGRAM_APP_SECRET || !signatureHeader) return false
    const expected = 'sha256=' + crypto.createHmac('sha256', process.env.INSTAGRAM_APP_SECRET).update(rawBody).digest('hex')
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))
    } catch {
        return false
    }
}

async function resolveProfile(igsid) {
    if (!process.env.INSTAGRAM_ACCESS_TOKEN) return null
    try {
        const res = await fetch(
            'https://graph.instagram.com/v21.0/' + igsid + '?fields=username,name,profile_pic&access_token=' + process.env.INSTAGRAM_ACCESS_TOKEN
        )
        const data = await res.json()
        if (!res.ok) return null
        return { username: data.username || null, name: data.name || null, profilePic: data.profile_pic || null }
    } catch {
        return null
    }
}

async function upsertConversation(igsid, preview, sentAt) {
    const { data: existing } = await supabase.from('instagram_conversations').select('*').eq('igsid', igsid).maybeSingle()

    if (existing) {
        const { data } = await supabase
            .from('instagram_conversations')
            .update({ last_message_at: sentAt, last_message_preview: preview.slice(0, 200), updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .select()
            .single()
        return data
    }

    // First time we've seen this person — try to resolve their username/name
    // for display, but don't block message capture if that lookup fails.
    const profile = await resolveProfile(igsid)

    const { data } = await supabase
        .from('instagram_conversations')
        .insert([{
            igsid,
            username: profile?.username || null,
            display_name: profile?.name || null,
            profile_picture_url: profile?.profilePic || null,
            last_message_at: sentAt,
            last_message_preview: preview.slice(0, 200),
        }])
        .select()
        .single()
    return data
}

async function processMessagingEvent(event) {
    const messageText = event?.message?.text
    if (!messageText) return // attachments/reads/reactions — not order-relevant, skip for now

    const mid = event?.message?.mid || null
    if (mid) {
        // Meta can redeliver the same webhook event — skip if already stored.
        const { data: existing } = await supabase.from('instagram_messages').select('id').eq('mid', mid).maybeSingle()
        if (existing) return
    }

    const isEcho = Boolean(event?.message?.is_echo)
    // An echo is a message WE sent, reflected back to us — the customer's
    // IGSID is then the recipient, not the sender.
    const igsid = isEcho ? event?.recipient?.id : event?.sender?.id
    if (!igsid) return

    const sentAt = new Date(Number(event.timestamp) || Date.now()).toISOString()
    const conversation = await upsertConversation(igsid, messageText, sentAt)
    if (!conversation) return

    await supabase.from('instagram_messages').insert([{
        conversation_id: conversation.id,
        igsid,
        direction: isEcho ? 'outbound' : 'inbound',
        message_text: messageText,
        mid,
        raw_payload: event,
        sent_at: sentAt,
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

    // Log every delivery attempt BEFORE the signature check — otherwise a
    // signature mismatch (e.g. a stale app secret) fails completely silently,
    // with no way to tell "Meta isn't delivering" apart from "we're
    // rejecting what they send". Must be awaited: an unawaited insert can
    // get killed mid-flight once the response below is sent, in a
    // serverless environment.
    try {
        await supabase.from('instagram_webhook_log').insert([{ raw_body: { ...payload, _signatureValid: signatureValid, _signatureHeader: signature || null } }])
    } catch (err) {
        console.log('Instagram webhook log error:', err)
    }

    if (!signatureValid) {
        return new Response('Invalid signature', { status: 401 })
    }

    try {
        const entries = Array.isArray(payload?.entry) ? payload.entry : []
        for (const entry of entries) {
            // Confirmed live via Meta's dashboard "Test" button: the actual
            // delivered shape is entry[].changes[] with {field: 'messages',
            // value: {...}} — not the older Messenger-style entry[].messaging[].
            // Both are checked here in case either shape shows up in practice.
            const changeEvents = (Array.isArray(entry.changes) ? entry.changes : [])
                .filter((c) => c.field === 'messages')
                .map((c) => c.value)
            const messagingEvents = Array.isArray(entry.messaging) ? entry.messaging : []
            for (const event of [...changeEvents, ...messagingEvents]) {
                await processMessagingEvent(event)
            }
        }
    } catch (err) {
        console.log('Instagram webhook processing error:', err)
    }

    return new Response('OK', { status: 200 })
}
