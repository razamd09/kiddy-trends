import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

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

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const employeeId = searchParams.get('employee_id')
        if (!employeeId) return Response.json({ error: 'employee_id required' }, { status: 400 })

        const { data, error } = await supabase
            .from('employees')
            .select('id, name, employee_id, role, email, is_active')
            .eq('employee_id', employeeId)
            .eq('is_active', true)
            .single()

        if (error || !data) {
            return Response.json({ error: 'Employee not found' }, { status: 404 })
        }

        const { data: permissionRow } = await supabase
            .from('employee_module_access')
            .select('can_manage_orders, can_manage_products, can_manage_rewards')
            .eq('employee_id', data.id)
            .single()

        return Response.json({
            success: true,
            employee: {
                ...data,
                permissions: normalizePermissions(permissionRow || DEFAULT_PERMISSIONS),
            },
        })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}
