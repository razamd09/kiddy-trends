// Temporary diagnostic endpoint — checks new_arrivals_carousel_kt_10's
// approval status directly via the Graph API. Delete once no longer needed.
export async function GET() {
    try {
        const res = await fetch(
            'https://graph.facebook.com/v21.0/' + process.env.WHATSAPP_BUSINESS_ACCOUNT_ID +
            '/message_templates?name=new_arrivals_carousel_kt_10&access_token=' + process.env.WHATSAPP_ACCESS_TOKEN
        )
        const data = await res.json()
        return Response.json(data)
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 })
    }
}
