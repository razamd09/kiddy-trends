import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function GET() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('id, title, images')

        if (error) {
            return Response.json({ success: false, error: error.message }, { status: 500 })
        }

        let totalProducts = 0
        let totalImages = 0
        let supabaseImages = 0
        let shopifyImages = 0
        let noImages = 0
        const pendingProducts = []

        for (const product of products || []) {
            totalProducts++
            const imgs = Array.isArray(product.images) ? product.images : []
            const flatImgs = imgs.map(i => typeof i === 'string' ? i : i?.src).filter(Boolean)

            if (flatImgs.length === 0) {
                noImages++
                continue
            }

            let hasShopify = false
            for (const url of flatImgs) {
                totalImages++
                if (url.includes('supabase')) {
                    supabaseImages++
                } else {
                    shopifyImages++
                    hasShopify = true
                }
            }

            if (hasShopify) {
                pendingProducts.push({ id: product.id, title: product.title })
            }
        }

        return Response.json({
            success: true,
            stats: {
                totalProducts,
                totalImages,
                supabaseImages,
                shopifyImages,
                noImages,
                pendingSync: pendingProducts.length,
                syncedPercent: totalImages > 0
                    ? Math.round((supabaseImages / totalImages) * 100)
                    : 0,
            },
            pendingProducts: pendingProducts.slice(0, 20),
        })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
