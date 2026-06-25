import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request) {
    try {
        const { data, error, count } = await supabase
            .from('collections')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ collections: data || [], total: count || 0 })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()

        const keywords = Array.isArray(body.keywords) 
            ? body.keywords 
            : body.keywords.split(',').map(k => k.trim()).filter(k => k)

        const { data, error } = await supabase
            .from('collections')
            .insert([{
                name: body.name,
                keywords: keywords,
                description: body.description || '',
                is_active: true,
            }])
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, collection: data })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const body = await request.json()
        const { id, ...updates } = body

        const keywords = updates.keywords
            ? (Array.isArray(updates.keywords) 
                ? updates.keywords 
                : updates.keywords.split(',').map(k => k.trim()).filter(k => k))
            : updates.keywords

        const { data, error } = await supabase
            .from('collections')
            .update({ ...updates, keywords, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, collection: data })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'Collection ID required' }, { status: 400 })

        const { error } = await supabase
            .from('collections')
            .delete()
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
