// One-time setup call: linking the app's webhook config to a specific
// Instagram account isn't automatic — Meta requires this explicit
// subscription request in addition to the dashboard webhook config, per
// https://developers.facebook.com/docs/instagram-platform/webhooks
// ("Your app must enable subscriptions by sending a POST request to the
// /me/subscribed_apps endpoint with the subscribed_fields parameter").
export async function GET(request) {
    if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
        return Response.json({ success: false, error: 'INSTAGRAM_ACCESS_TOKEN is not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') // 'status' | 'whoami' | default = subscribe

    try {
        if (mode === 'status') {
            const res = await fetch('https://graph.instagram.com/v21.0/me/subscribed_apps?access_token=' + process.env.INSTAGRAM_ACCESS_TOKEN)
            const data = await res.json()
            return Response.json({ success: res.ok, data })
        }

        if (mode === 'whoami') {
            const res = await fetch('https://graph.instagram.com/v21.0/me?fields=id,username&access_token=' + process.env.INSTAGRAM_ACCESS_TOKEN)
            const data = await res.json()
            return Response.json({ success: res.ok, data })
        }

        if (mode === 'permissions') {
            const res = await fetch(
                'https://graph.facebook.com/debug_token?input_token=' + process.env.INSTAGRAM_ACCESS_TOKEN + '&access_token=' + process.env.INSTAGRAM_ACCESS_TOKEN
            )
            const data = await res.json()
            return Response.json({ success: res.ok, data })
        }

        const res = await fetch(
            'https://graph.instagram.com/v21.0/me/subscribed_apps?subscribed_fields=messages&access_token=' + process.env.INSTAGRAM_ACCESS_TOKEN,
            { method: 'POST' }
        )
        const data = await res.json()
        if (!res.ok) {
            return Response.json({ success: false, error: data?.error?.message || 'Subscription failed', raw: data }, { status: 502 })
        }
        return Response.json({ success: true, data })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
