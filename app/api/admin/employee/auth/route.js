import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function POST(request) {
    const { employee_id, password } = await request.json()

    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', employee_id)
        .eq('password', password)
        .eq('is_active', true)
        .single()

    if (error || !data) {
        return Response.json({ error: 'Invalid ID or password' }, { status: 401 })
    }

    return Response.json({
        success: true,
        employee: {
            id:          data.id,
            name:        data.name,
            employee_id: data.employee_id,
            role:        data.role,
            email:       data.email,
        }
    })
}