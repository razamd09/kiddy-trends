import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = Number(searchParams.get('productId'))

        if (!Number.isFinite(productId)) {
            return Response.json({ success: false, error: 'productId is required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('product_reviews')
            .select('id, customer_name, rating, review_text, created_at')
            .eq('product_id', productId)
            .eq('is_approved', true)
            .order('created_at', { ascending: false })

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

        const reviews = data || []
        const count = reviews.length
        const averageRating = count > 0
            ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
            : 0

        return Response.json({ success: true, reviews, count, averageRating })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}))
        const productId = Number(body?.productId)
        const customerName = String(body?.customerName || '').trim().slice(0, 100)
        const rating = Number(body?.rating)
        const reviewText = String(body?.reviewText || '').trim().slice(0, 2000)

        if (!Number.isFinite(productId)) {
            return Response.json({ success: false, error: 'productId is required' }, { status: 400 })
        }
        if (!customerName) {
            return Response.json({ success: false, error: 'Please enter your name' }, { status: 400 })
        }
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return Response.json({ success: false, error: 'Please select a rating' }, { status: 400 })
        }

        const { error } = await supabase
            .from('product_reviews')
            .insert([{
                product_id: productId,
                customer_name: customerName,
                rating,
                review_text: reviewText || null,
                is_approved: false,
            }])

        if (error) return Response.json({ success: false, error: error.message }, { status: 500 })

        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
