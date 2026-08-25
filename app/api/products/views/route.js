import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(
    supabaseUrl,
    anonKey
)

const supabaseService = supabaseUrl && serviceKey
    ? createClient(supabaseUrl, serviceKey)
    : null

function sanitizeText(value, maxLen = 200) {
    return String(value || '').trim().slice(0, maxLen)
}

function firstHeader(request, keys) {
    for (const key of keys) {
        const value = request.headers.get(key)
        if (value && String(value).trim()) return String(value).trim()
    }
    return ''
}

function buildRequestMetadata(request) {
    const forwardedFor = firstHeader(request, ['x-forwarded-for', 'x-vercel-forwarded-for', 'cf-connecting-ip', 'true-client-ip', 'x-real-ip', 'x-client-ip'])
    const forwardedIp = forwardedFor.includes(',') ? forwardedFor.split(',')[0] : forwardedFor
    const ip = sanitizeText(forwardedIp, 80)
    const userAgent = sanitizeText(firstHeader(request, ['user-agent', 'sec-ch-ua']), 300)
    const referrer = sanitizeText(firstHeader(request, ['referer', 'referrer']), 300)
    const host = sanitizeText(firstHeader(request, ['host', 'x-forwarded-host']), 120)

    return {
        ip: ip || null,
        user_agent: userAgent || null,
        referrer: referrer || null,
        host: host || null,
    }
}

async function writeAnalyticsProductView({ sessionId, productId, path, requestMetadata }) {
    if (!sessionId || !productId || !supabaseService) return
    await supabaseService
        .from('website_analytics_events')
        .insert([{
            session_id: sanitizeText(sessionId, 128),
            event_name: 'product_view',
            path: sanitizeText(path, 300) || '/products',
            product_id: sanitizeText(productId, 120),
            metadata: {
                source: 'products_views_api',
                ...requestMetadata,
            },
        }])
}

export async function POST(request) {
    const body = await request.json().catch(() => ({}))
    const product_id = String(body?.product_id || '')
    const sessionId = String(body?.session_id || request.headers.get('x-analytics-session') || '')
    const path = String(body?.path || '')
    const requestMetadata = buildRequestMetadata(request)

    if (!product_id) {
        return Response.json({ success: false, error: 'product_id is required' }, { status: 400 })
    }

    writeAnalyticsProductView({ sessionId, productId: product_id, path, requestMetadata }).catch(() => {})

    // Use upsert to increment view count
    const { data: existing } = await supabase
        .from('product_views')
        .select('views')
        .eq('product_id', product_id)
        .single()

    if (existing) {
        await supabase
            .from('product_views')
            .update({ views: existing.views + 1 })
            .eq('product_id', product_id)
        return Response.json({ views: existing.views + 1 })
    } else {
        await supabase
            .from('product_views')
            .insert([{ product_id, views: 1 }])
        return Response.json({ views: 1 })
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const product_id = searchParams.get('product_id')
    const { data } = await supabase
        .from('product_views')
        .select('views')
        .eq('product_id', String(product_id))
        .single()
    return Response.json({ views: data?.views || 0 })
}