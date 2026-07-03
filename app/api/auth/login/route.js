import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Unified login for the single /admin portal. Authenticates against the
// employees table (role-based) with a fallback to the legacy env admin, so
// both admins and staff sign in from one screen with a user id + password.
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kiddy@admin2024'
const ADMIN_USER_ID  = process.env.ADMIN_USER_ID || 'admin'

const DEFAULT_PERMISSIONS = {
    can_manage_orders: true,
    can_manage_products: true,
    can_manage_rewards: true,
}

function normalizePermissions(input) {
    const src = input || {}
    return {
        can_manage_orders: src.can_manage_orders !== false,
        can_manage_products: src.can_manage_products !== false,
        can_manage_rewards: src.can_manage_rewards !== false,
    }
}

async function mintAdminToken() {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    const { error } = await supabase.from('admin_sessions').insert([{
        token,
        expires_at: expiresAt.toISOString(),
    }])
    if (error) console.error('admin_sessions insert error:', error)
    return { token, expiresAt }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const uid  = String(body.user_id || '').trim()
        const pass = String(body.password || '')

        // 1) Employees table — covers both admin-role and staff accounts.
        const { data: emp } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', uid)
            .eq('password', pass)
            .eq('is_active', true)
            .single()

        if (emp) {
            const { data: permissionRow } = await supabase
                .from('employee_module_access')
                .select('can_manage_orders, can_manage_products, can_manage_rewards')
                .eq('employee_id', emp.id)
                .single()
            const permissions = normalizePermissions(permissionRow || DEFAULT_PERMISSIONS)
            const employee = {
                id:          emp.id,
                name:        emp.name,
                employee_id: emp.employee_id,
                role:        emp.role,
                email:       emp.email,
                permissions,
            }

            if (emp.role === 'admin') {
                const { token } = await mintAdminToken()
                const response = NextResponse.json({ success: true, role: 'admin', token, employee })
                response.cookies.set('admin_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60,
                })
                return response
            }

            return NextResponse.json({ success: true, role: 'employee', employee })
        }

        // 2) Legacy env admin — keeps the existing admin working with a user id.
        if (uid.toLowerCase() === ADMIN_USER_ID.toLowerCase() && pass === ADMIN_PASSWORD) {
            const { token } = await mintAdminToken()
            const employee = { name: 'Admin', employee_id: uid, role: 'admin' }
            const response = NextResponse.json({ success: true, role: 'admin', token, employee })
            response.cookies.set('admin_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60,
            })
            return response
        }

        return NextResponse.json({ success: false, error: 'Invalid User ID or password' }, { status: 401 })
    } catch (err) {
        console.error('Unified auth error:', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
