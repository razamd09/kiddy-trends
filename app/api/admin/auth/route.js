import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kiddy@admin2024'

export async function POST(request) {
    const { password } = await request.json()

    if (password !== ADMIN_PASSWORD) {
        return Response.json({ success: false, error: 'Invalid password' }, { status: 401 })
    }

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await supabase.from('admin_sessions').insert([{
        token,
        expires_at: expiresAt.toISOString()
    }])

    const response = Response.json({ success: true, token })
    response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24 hours
    })
    return response
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