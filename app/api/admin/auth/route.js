import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kiddy@admin2024'

export async function POST(request) {
    const { password } = await request.json()

    if (password !== ADMIN_PASSWORD) {
        return Response.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await supabase.from('admin_sessions').insert([{
        token,
        expires_at: expiresAt.toISOString()
    }])

    return Response.json({ success: true, token })
}

export async function GET(request) {
    const token = request.headers.get('x-admin-token')
    if (!token) return Response.json({ valid: false })

    const { data } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single()

    return Response.json({ valid: !!data })
}