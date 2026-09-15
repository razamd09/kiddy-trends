import { createClient } from '@supabase/supabase-js'
import { sendEmailWithEmailJs } from '../customers/customer-data'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

async function requireAdmin(request) {
    const token = request.headers.get('x-admin-token')
    if (!token) return false

    const { data: session } = await supabase
        .from('admin_sessions')
        .select('token')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single()

    return Boolean(session)
}

function chunkArray(values, chunkSize) {
    const chunks = []
    for (let i = 0; i < values.length; i += chunkSize) {
        chunks.push(values.slice(i, i + chunkSize))
    }
    return chunks
}

export async function GET(request) {
    try {
        if (!(await requireAdmin(request))) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .select('id, email, source, created_at')
            .order('created_at', { ascending: false })

        if (error) return Response.json({ error: error.message }, { status: 500 })

        return Response.json({ success: true, subscribers: data || [], total: data?.length || 0 })
    } catch (error) {
        return Response.json({ error: error.message || 'Failed to load subscribers' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        if (!(await requireAdmin(request))) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json().catch(() => ({}))
        const subject = String(body?.subject || '').trim()
        const message = String(body?.message || '').trim()

        if (!subject || !message) {
            return Response.json({ error: 'Subject and message are required' }, { status: 400 })
        }

        const { data: subscribers, error } = await supabase
            .from('newsletter_subscribers')
            .select('email')

        if (error) return Response.json({ error: error.message }, { status: 500 })

        const recipients = (subscribers || []).map((s) => s.email).filter(Boolean)
        if (recipients.length === 0) {
            return Response.json({ success: true, sent: 0, failed: 0, totalRecipients: 0 })
        }

        let sent = 0
        let failed = 0
        const batches = chunkArray(recipients, 20)

        for (const batch of batches) {
            const results = await Promise.allSettled(
                batch.map((email) => sendEmailWithEmailJs(email, subject, message))
            )
            for (const result of results) {
                if (result.status === 'fulfilled') sent += 1
                else failed += 1
            }
        }

        return Response.json({ success: true, sent, failed, totalRecipients: recipients.length })
    } catch (error) {
        return Response.json({ error: error.message || 'Failed to send campaign' }, { status: 500 })
    }
}
