import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

async function requireAdmin(request) {
    const token = request.headers.get('x-admin-token')
    if (!token) return false

    const { data: session } = await supabase
        .from('admin_sessions')
        .select('token')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single()

    return Boolean(session)
}

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

export async function GET(request) {
    try {
        if (!(await requireAdmin(request))) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) return Response.json({ error: error.message }, { status: 500 })

        return Response.json({ success: true, posts: data || [] })
    } catch (error) {
        return Response.json({ error: error.message || 'Failed to load posts' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        if (!(await requireAdmin(request))) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json().catch(() => ({}))
        const title = String(body?.title || '').trim()
        const content = String(body?.content || '').trim()

        if (!title) return Response.json({ error: 'Title is required' }, { status: 400 })
        if (!content) return Response.json({ error: 'Content is required' }, { status: 400 })

        const requestedSlug = slugify(body?.slug || title)
        if (!requestedSlug) return Response.json({ error: 'Could not generate a slug from this title' }, { status: 400 })

        const isPublished = Boolean(body?.is_published)

        const { data, error } = await supabase
            .from('blog_posts')
            .insert([{
                slug: requestedSlug,
                title,
                excerpt: String(body?.excerpt || '').trim() || null,
                content,
                cover_image: String(body?.cover_image || '').trim() || null,
                is_published: isPublished,
                published_at: isPublished ? new Date().toISOString() : null,
            }])
            .select()
            .single()

        if (error) {
            if (error.code === '23505') return Response.json({ error: 'A post with this slug already exists' }, { status: 409 })
            return Response.json({ error: error.message }, { status: 500 })
        }

        return Response.json({ success: true, post: data })
    } catch (error) {
        return Response.json({ error: error.message || 'Failed to create post' }, { status: 500 })
    }
}

export async function PATCH(request) {
    try {
        if (!(await requireAdmin(request))) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json().catch(() => ({}))
        const id = String(body?.id || '').trim()
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

        const { data: existing } = await supabase
            .from('blog_posts')
            .select('is_published')
            .eq('id', id)
            .single()

        const update = { updated_at: new Date().toISOString() }
        if (body?.title !== undefined) update.title = String(body.title).trim()
        if (body?.slug !== undefined) update.slug = slugify(body.slug)
        if (body?.excerpt !== undefined) update.excerpt = String(body.excerpt).trim() || null
        if (body?.content !== undefined) update.content = String(body.content).trim()
        if (body?.cover_image !== undefined) update.cover_image = String(body.cover_image).trim() || null
        if (body?.is_published !== undefined) {
            update.is_published = Boolean(body.is_published)
            if (update.is_published && !existing?.is_published) {
                update.published_at = new Date().toISOString()
            }
        }

        const { error } = await supabase
            .from('blog_posts')
            .update(update)
            .eq('id', id)

        if (error) {
            if (error.code === '23505') return Response.json({ error: 'A post with this slug already exists' }, { status: 409 })
            return Response.json({ error: error.message }, { status: 500 })
        }

        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ error: error.message || 'Failed to update post' }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        if (!(await requireAdmin(request))) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = String(searchParams.get('id') || '').trim()
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id)

        if (error) return Response.json({ error: error.message }, { status: 500 })

        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ error: error.message || 'Failed to delete post' }, { status: 500 })
    }
}
