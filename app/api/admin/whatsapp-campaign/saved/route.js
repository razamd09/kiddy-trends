import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export const dynamic = 'force-dynamic'

// Saved campaign configs — a video campaign's video/tagline/button, or a
// carousel campaign's product selection — so relaunching the same campaign
// later (to a fresh batch, or to whoever didn't respond) doesn't mean
// re-uploading the video and retyping everything from scratch.
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('whatsapp_campaigns')
            .select('*')
            .order('updated_at', { ascending: false })

        if (error) throw new Error(error.message)
        return Response.json({ success: true, campaigns: data || [] })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const { name, type, content } = await request.json()
        const cleanName = String(name || '').trim()
        if (!cleanName) return Response.json({ success: false, error: 'Name is required' }, { status: 400 })
        if (type !== 'carousel' && type !== 'video') {
            return Response.json({ success: false, error: 'type must be carousel or video' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('whatsapp_campaigns')
            .insert([{ name: cleanName, type, content: content || {} }])
            .select()
            .single()

        if (error) throw new Error(error.message)
        return Response.json({ success: true, campaign: data })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const { id, name, content } = await request.json()
        if (!id) return Response.json({ success: false, error: 'id is required' }, { status: 400 })

        const updates = { updated_at: new Date().toISOString() }
        if (name !== undefined) updates.name = String(name || '').trim()
        if (content !== undefined) updates.content = content

        const { data, error } = await supabase
            .from('whatsapp_campaigns')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return Response.json({ success: true, campaign: data })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return Response.json({ success: false, error: 'id is required' }, { status: 400 })

        const { error } = await supabase.from('whatsapp_campaigns').delete().eq('id', id)
        if (error) throw new Error(error.message)
        return Response.json({ success: true })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
