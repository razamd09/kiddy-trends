const GRAPH_API_VERSION = 'v21.0'
const POST_LIMIT = 8

// Shown until INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_BUSINESS_ACCOUNT_ID are set,
// and again if the Graph API call ever fails (expired token, rate limit,
// etc.) — the section should never go blank or break the page.
const FALLBACK_POSTS = [
    { id: 'DZ7W_ZWo-k1', permalink: 'https://www.instagram.com/p/DZ7W_ZWo-k1/', embedFallback: true },
    { id: 'DZ9YMmLCCjg', permalink: 'https://www.instagram.com/p/DZ9YMmLCCjg/', embedFallback: true },
    { id: 'DZ4bJK5iHA3', permalink: 'https://www.instagram.com/p/DZ4bJK5iHA3/', embedFallback: true },
    { id: 'DZ21w0hCOEz', permalink: 'https://www.instagram.com/p/DZ21w0hCOEz/', embedFallback: true },
]

export async function GET() {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
    const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID

    if (!accessToken || !businessAccountId) {
        return Response.json({ success: true, posts: FALLBACK_POSTS, live: false })
    }

    try {
        const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'
        // This token comes from the newer "Instagram API with Instagram Login"
        // flow (starts with "IGAA"), which is served from graph.instagram.com,
        // not graph.facebook.com (the older Facebook-Login-based flow).
        const url = `https://graph.instagram.com/${GRAPH_API_VERSION}/${businessAccountId}/media?fields=${fields}&limit=${POST_LIMIT}&access_token=${accessToken}`

        const res = await fetch(url, { next: { revalidate: 3600 } })
        const data = await res.json()

        if (!res.ok || !Array.isArray(data?.data)) {
            return Response.json({ success: true, posts: FALLBACK_POSTS, live: false })
        }

        const posts = data.data.map((post) => ({
            id: post.id,
            caption: post.caption || '',
            mediaType: post.media_type,
            imageUrl: post.media_type === 'VIDEO' ? (post.thumbnail_url || post.media_url) : post.media_url,
            permalink: post.permalink,
            timestamp: post.timestamp,
        }))

        return Response.json({ success: true, posts, live: true })
    } catch {
        return Response.json({ success: true, posts: FALLBACK_POSTS, live: false })
    }
}
