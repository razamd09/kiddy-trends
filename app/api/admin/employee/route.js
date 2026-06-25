import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

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

        // Check if employee_id already exists
        const { data: existing } = await supabase
            .from('employees')
            .select('id')
            .eq('employee_id', body.employee_id)
            .single()

        if (existing) {
            return Response.json({ error: 'Employee ID already exists' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('employees')
            .insert([{
                name:        body.name,
                employee_id: body.employee_id,
                email:       body.email || '',
                phone:       body.phone || '',
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
    const body = await request.json()
    const { id, ...updates } = body
    if (updates.password === '') delete updates.password
    const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, employee: data })
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
}