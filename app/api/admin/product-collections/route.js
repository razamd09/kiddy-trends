import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function POST(request) {
    try {
        const { productId, collectionIds } = await request.json()

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
        }

        const { error } = await supabase
            .from('product_collections')
            .delete()
            .eq('product_id', productId)

        if (error) console.error('Delete error:', error)

        if (collectionIds && collectionIds.length > 0) {
            const { error: insertError } = await supabase
                .from('product_collections')
                .insert(
                    collectionIds.map(cid => ({
                        product_id: productId,
                        collection_id: cid
                    }))
                )

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 })
            }
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('product_collections')
            .select('collection_id')
            .eq('product_id', productId)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ collectionIds: data.map(d => d.collection_id) })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const { productTitle } = await request.json()

        const { data: collections, error: collError } = await supabase
            .from('collections')
            .select('*')
            .eq('is_active', true)

        if (collError) {
            return NextResponse.json({ error: collError.message }, { status: 500 })
        }

        const matchedCollections = collections
            .filter(collection => {
                const keywords = collection.keywords || []
                return keywords.some(keyword => 
                    productTitle.toLowerCase().includes(keyword.toLowerCase())
                )
            })
            .map(c => c.id)

        return NextResponse.json({ matchedCollections })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
