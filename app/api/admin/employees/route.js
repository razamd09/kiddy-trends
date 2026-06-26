import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function normalizePhone(value) {
    let digits = String(value || '').replace(/\D/g, '')
    if (digits.startsWith('92') && digits.length > 10) digits = digits.slice(2)
    if (digits.startsWith('0') && digits.length > 10) digits = digits.slice(1)
    if (!digits) return ''
    if (digits.length !== 10) return null
    return '+92' + digits
}

export async function GET(request) {
    const { data, error } = await supabase
        .from('employees')
        .select('id, name, employee_id, email, phone, role, is_active, created_at')
        .order('created_at', { ascending: false })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ employees: data })
}

export async function POST(request) {
    try {
        const body = await request.json()
        const normalizedPhone = normalizePhone(body.phone)
        if (body.phone && normalizedPhone === null) {
            return Response.json({ error: 'Phone must be 10 digits' }, { status: 400 })
        }
        const { data, error } = await supabase
            .from('employees')
            .insert([{
                name:        body.name,
                employee_id: body.employee_id,
                email:       body.email || '',
                phone:       normalizedPhone || '',
                role:        body.role || 'employee',
                password:    body.password,
                is_active:   true,
            }])
            .select()
            .single()
        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, employee: data })
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const body = await request.json()
        const { id, ...updates } = body
        if (updates.password === '') delete updates.password
        if (Object.prototype.hasOwnProperty.call(updates, 'phone')) {
            const normalizedPhone = normalizePhone(updates.phone)
            if (updates.phone && normalizedPhone === null) {
                return Response.json({ error: 'Phone must be 10 digits' }, { status: 400 })
            }
            updates.phone = normalizedPhone || ''
        }
        const { data, error } = await supabase
            .from('employees')
            .update(updates)
            .eq('id', id)
            .select()
            .single()
        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, employee: data })
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const { error } = await supabase.from('employees').delete().eq('id', id)
        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true })
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 })
    }
}