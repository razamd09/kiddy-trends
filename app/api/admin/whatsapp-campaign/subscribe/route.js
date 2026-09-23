// One-time setup call, mirroring the same requirement we found for
// Instagram: the WhatsApp Business Account itself has to explicitly
// subscribe the app to receive its webhook events (status updates, inbound
// messages) — configuring the callback URL/fields in the app dashboard
// alone isn't enough.
export async function GET() {
    if (!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
        return Response.json({ success: false, error: 'WHATSAPP_BUSINESS_ACCOUNT_ID / WHATSAPP_ACCESS_TOKEN not configured' }, { status: 500 })
    }

    try {
        const res = await fetch(
            'https://graph.facebook.com/v21.0/' + process.env.WHATSAPP_BUSINESS_ACCOUNT_ID + '/subscribed_apps',
            {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + process.env.WHATSAPP_ACCESS_TOKEN },
            }
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            return Response.json({ success: false, error: data?.error?.message || ('Subscribe failed (' + res.status + ')'), raw: data }, { status: 502 })
        }
        return Response.json({ success: true, data })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
