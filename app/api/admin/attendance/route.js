import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const BUSINESS_TIMEZONE = process.env.ATTENDANCE_TIMEZONE || 'Asia/Karachi'

function pad(value) {
    return String(value).padStart(2, '0')
}

function getDatePartsInTimeZone(date, timeZone = BUSINESS_TIMEZONE) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date)
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
    return {
        year: Number(map.year),
        month: Number(map.month),
        day: Number(map.day),
        hour: Number(map.hour),
        minute: Number(map.minute),
        second: Number(map.second),
    }
}

function toYmdInTz(date, timeZone = BUSINESS_TIMEZONE) {
    const p = getDatePartsInTimeZone(date, timeZone)
    return p.year + '-' + pad(p.month) + '-' + pad(p.day)
}

function toTimestampWithoutTzInTz(date, timeZone = BUSINESS_TIMEZONE) {
    const p = getDatePartsInTimeZone(date, timeZone)
    return p.year + '-' + pad(p.month) + '-' + pad(p.day) + 'T' + pad(p.hour) + ':' + pad(p.minute) + ':' + pad(p.second)
}

async function getInternetNow() {
    try {
        const res = await fetch('https://worldtimeapi.org/api/timezone/Asia/Karachi', { cache: 'no-store' })
        if (!res.ok) throw new Error('time api unavailable')
        const data = await res.json()
        if (data?.utc_datetime) return new Date(data.utc_datetime)
        if (data?.datetime) return new Date(data.datetime)
    } catch {}
    return new Date()
}

// GET — fetch attendance
export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employee_id')
    const period     = searchParams.get('period') || 'daily'
    const internetNow = await getInternetNow()
    const date = searchParams.get('date') || toYmdInTz(internetNow)

    let query = supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false })

    if (employeeId) query = query.eq('employee_id', employeeId)

    if (period === 'daily') {
        query = query.eq('date', date)
    } else if (period === 'weekly') {
        const weekStart = new Date(date)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        query = query.gte('date', weekStart.toISOString().split('T')[0])
            .lte('date', weekEnd.toISOString().split('T')[0])
    } else if (period === 'monthly') {
        const monthStart = date.substring(0, 7) + '-01'
        const monthEnd   = new Date(new Date(monthStart).getFullYear(), new Date(monthStart).getMonth() + 1, 0).toISOString().split('T')[0]
        query = query.gte('date', monthStart).lte('date', monthEnd)
    } else if (period === 'yearly') {
        const year = date.substring(0, 4)
        query = query.gte('date', year + '-01-01').lte('date', year + '-12-31')
    }

    const { data, error } = await query
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ attendance: data })
}

// POST — time in
export async function POST(request) {
    const { employee_id, employee_name } = await request.json()
    const internetNow = await getInternetNow()
    const today = toYmdInTz(internetNow)

    // Check already timed in today
    const { data: existing } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employee_id)
        .eq('date', today)
        .single()

    if (existing) return Response.json({ error: 'Already timed in today', existing }, { status: 400 })

    const { data, error } = await supabase
        .from('attendance')
        .insert([{
            employee_id,
            employee_name,
            date:    today,
            time_in: toTimestampWithoutTzInTz(internetNow),
            status:  'present',
        }])
        .select()
        .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, attendance: data, server_time: internetNow.toISOString() })
}

// PUT — time out
export async function PUT(request) {
    const { employee_id } = await request.json()
    const internetNow = await getInternetNow()
    const today = toYmdInTz(internetNow)

    const { data: existing } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employee_id)
        .eq('date', today)
        .single()

    if (!existing) return Response.json({ error: 'No time-in record found' }, { status: 404 })
    if (existing.time_out) return Response.json({ error: 'Already timed out today' }, { status: 400 })

    const timeOut = internetNow
    const timeIn   = new Date(existing.time_in)
    const duration = Math.round((timeOut - timeIn) / 60000)

    const { data, error } = await supabase
        .from('attendance')
        .update({
            time_out:         toTimestampWithoutTzInTz(timeOut),
            duration_minutes: duration,
        })
        .eq('id', existing.id)
        .select()
        .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, attendance: data, server_time: internetNow.toISOString() })
}