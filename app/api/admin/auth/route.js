import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kiddy@admin2024'

export async function POST(request) {
    try {
        const { password } = await request.json()

        if (password !== ADMIN_PASSWORD) {
            return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 })
        }

        const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        // Try to insert, but don't fail if table doesn't exist
        const { error } = await supabase.from('admin_sessions').insert([{
            token,
            expires_at: expiresAt.toISOString()
        }])

        if (error) {
            console.error('Supabase insert error:', error)
        }

        const response = NextResponse.json({ success: true, token })
        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60
        })
        return response
    } catch (err) {
        console.error('Auth API error:', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function GET(request) {
    const token = request.headers.get('x-admin-token')
    if (!token) return NextResponse.json({ valid: false })

    const { data } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single()

    return NextResponse.json({ valid: !!data })
}