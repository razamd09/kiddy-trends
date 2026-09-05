import { supabaseAdmin } from './supabaseAdmin'

export async function requireAdmin(request) {
  const token = request.headers.get('x-admin-token') || request.cookies.get('admin_token')?.value
  if (!token) return false

  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('token')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  return Boolean(data?.token)
}
