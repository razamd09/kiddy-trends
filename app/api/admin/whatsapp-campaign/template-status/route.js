// Temporary diagnostic endpoint — checks a template's approval status
// directly via the Graph API. Delete once no longer needed.
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const name = searchParams.get('name') || 'single_video_promo_kt'
        const res = await fetch(
            'https://graph.facebook.com/v21.0/' + process.env.WHATSAPP_BUSINESS_ACCOUNT_ID +
            '/message_templates?name=' + encodeURIComponent(name) + '&access_token=' + process.env.WHATSAPP_ACCESS_TOKEN
        )
        const data = await res.json()
        return Response.json(data)
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 })
    }
}
