import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

// Self-serve troubleshooting: shows whether Meta has ever actually hit our
// webhook at all, and if so, whether the signature check passed — the two
// questions that otherwise required a direct database query to answer.
export async function GET() {
    const { count: logCount } = await supabase
        .from('instagram_webhook_log')
        .select('id', { count: 'exact', head: true })

    const { data: recentLogs } = await supabase
        .from('instagram_webhook_log')
        .select('id, raw_body, received_at')
        .order('received_at', { ascending: false })
        .limit(5)

    const { count: conversationCount } = await supabase
        .from('instagram_conversations')
        .select('id', { count: 'exact', head: true })

    const { count: messageCount } = await supabase
        .from('instagram_messages')
        .select('id', { count: 'exact', head: true })

    return Response.json({
        success: true,
        totalWebhookDeliveries: logCount || 0,
        totalConversations: conversationCount || 0,
        totalMessages: messageCount || 0,
        recentDeliveries: (recentLogs || []).map((log) => ({
            id: log.id,
            receivedAt: log.received_at,
            signatureValid: log.raw_body?._signatureValid ?? null,
            preview: JSON.stringify(log.raw_body).slice(0, 300),
        })),
        configured: {
            INSTAGRAM_APP_SECRET: Boolean(process.env.INSTAGRAM_APP_SECRET),
            INSTAGRAM_WEBHOOK_VERIFY_TOKEN: Boolean(process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN),
            INSTAGRAM_ACCESS_TOKEN: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN),
        },
    })
}
