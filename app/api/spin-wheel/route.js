import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const MAX_SPINS_PER_DAY = 2
const WIN_OPTIONS = [10, 20]
const TZ = 'Asia/Karachi'
const SPIN_HASH_SECRET = process.env.SPIN_WHEEL_HASH_SECRET || 'kt_spin_wheel_secret_v1'

function nowInKarachi() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }))
}

function getDayKey(dateObj = nowInKarachi()) {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getEndOfDayIso(dateObj = nowInKarachi()) {
  const end = new Date(dateObj)
  end.setHours(23, 59, 59, 999)
  return end.toISOString()
}

function hashValue(input) {
  return createHash('sha256').update(String(input || '') + '|' + SPIN_HASH_SECRET).digest('hex')
}

function readFingerprint(value) {
  const fingerprint = String(value || '').trim()
  if (!fingerprint) return ''
  if (fingerprint.length < 8 || fingerprint.length > 256) return ''
  return fingerprint
}

function getClientIp(request) {
  const forwarded = String(request.headers.get('x-forwarded-for') || '').trim()
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = String(request.headers.get('x-real-ip') || '').trim()
  return realIp
}

function getUserAgent(request) {
  return String(request.headers.get('user-agent') || '').trim()
}

function normalizeSessionRow(row) {
  if (!row) return null
  const spinsUsed = Math.max(0, Math.min(MAX_SPINS_PER_DAY, Number(row.spins_used || 0)))
  const spinsLeft = Math.max(0, MAX_SPINS_PER_DAY - spinsUsed)
  const activeDiscount = row.consumed ? 0 : Number(row.active_discount || 0)

  return {
    spinsUsed,
    spinsLeft,
    activeDiscount: activeDiscount === 10 || activeDiscount === 20 ? activeDiscount : 0,
    discountCode: row.consumed ? '' : String(row.discount_code || ''),
    consumed: Boolean(row.consumed),
    lockedUntil: getEndOfDayIso(),
  }
}

async function getSession(dayKey, fingerprintHash, userAgentHash) {
  const { data, error } = await supabase
    .from('spin_wheel_sessions')
    .select('*')
    .eq('day_key', dayKey)
    .eq('fingerprint_hash', fingerprintHash)
    .eq('user_agent_hash', userAgentHash)
    .maybeSingle()

  if (error) throw error
  return data || null
}

function buildPublicStatus(session, dayKey) {
  if (!session) {
    return {
      dayKey,
      spinsUsed: 0,
      spinsLeft: MAX_SPINS_PER_DAY,
      canSpin: true,
      activeDiscount: 0,
      discountCode: '',
      consumed: false,
      lockedUntil: getEndOfDayIso(),
    }
  }

  const normalized = normalizeSessionRow(session)
  return {
    dayKey,
    spinsUsed: normalized.spinsUsed,
    spinsLeft: normalized.spinsLeft,
    canSpin: normalized.spinsLeft > 0,
    activeDiscount: normalized.activeDiscount,
    discountCode: normalized.discountCode,
    consumed: normalized.consumed,
    lockedUntil: normalized.lockedUntil,
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const fingerprint = readFingerprint(searchParams.get('fingerprint') || request.headers.get('x-spin-fingerprint'))

    if (!fingerprint) {
      return Response.json({ error: 'Fingerprint is required' }, { status: 400 })
    }

    const dayKey = getDayKey()
    const userAgent = getUserAgent(request)
    const fingerprintHash = hashValue('fp|' + fingerprint)
    const userAgentHash = hashValue('ua|' + userAgent)
    const session = await getSession(dayKey, fingerprintHash, userAgentHash)

    return Response.json({ success: true, ...buildPublicStatus(session, dayKey) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = String(body?.action || 'spin').trim().toLowerCase()
    const fingerprint = readFingerprint(body?.fingerprint || request.headers.get('x-spin-fingerprint'))

    if (!fingerprint) {
      return Response.json({ success: false, error: 'Fingerprint is required' }, { status: 400 })
    }

    const dayKey = getDayKey()
    const nowIso = new Date().toISOString()
    const userAgent = getUserAgent(request)
    const ip = getClientIp(request)

    const fingerprintHash = hashValue('fp|' + fingerprint)
    const userAgentHash = hashValue('ua|' + userAgent)
    const ipHash = ip ? hashValue('ip|' + ip) : null

    if (action === 'consume') {
      const discountCode = String(body?.discountCode || '').trim()
      if (!discountCode) {
        return Response.json({ success: false, error: 'discountCode is required for consume' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('spin_wheel_sessions')
        .update({
          consumed: true,
          active_discount: 0,
          updated_at: nowIso,
          ip_hash: ipHash,
        })
        .eq('day_key', dayKey)
        .eq('fingerprint_hash', fingerprintHash)
        .eq('user_agent_hash', userAgentHash)
        .eq('discount_code', discountCode)
        .eq('consumed', false)
        .select('*')
        .maybeSingle()

      if (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
      }

      const latest = data || (await getSession(dayKey, fingerprintHash, userAgentHash))
      return Response.json({ success: true, consumed: !!data, ...buildPublicStatus(latest, dayKey) })
    }

    if (action !== 'spin') {
      return Response.json({ success: false, error: 'Unsupported action' }, { status: 400 })
    }

    let current = await getSession(dayKey, fingerprintHash, userAgentHash)

    if (current && Number(current.spins_used || 0) >= MAX_SPINS_PER_DAY) {
      const status = buildPublicStatus(current, dayKey)
      return Response.json({ success: false, error: 'Daily limit reached', ...status }, { status: 429 })
    }

    const wonPercent = WIN_OPTIONS[Math.floor(Math.random() * WIN_OPTIONS.length)]
    const discountCode = 'SPINPCT' + wonPercent

    if (!current) {
      const { data: inserted, error: insertError } = await supabase
        .from('spin_wheel_sessions')
        .insert([{
          day_key: dayKey,
          fingerprint_hash: fingerprintHash,
          user_agent_hash: userAgentHash,
          ip_hash: ipHash,
          spins_used: 1,
          active_discount: wonPercent,
          discount_code: discountCode,
          consumed: false,
          last_spin_at: nowIso,
          updated_at: nowIso,
        }])
        .select('*')
        .single()

      if (insertError) {
        const conflict = String(insertError.message || '').toLowerCase().includes('duplicate')
        if (!conflict) {
          return Response.json({ success: false, error: insertError.message }, { status: 500 })
        }
      } else {
        const status = buildPublicStatus(inserted, dayKey)
        return Response.json({ success: true, wonPercent, ...status })
      }

      current = await getSession(dayKey, fingerprintHash, userAgentHash)
    }

    const nextSpins = Math.min(MAX_SPINS_PER_DAY, Number(current?.spins_used || 0) + 1)
    const { data: updated, error: updateError } = await supabase
      .from('spin_wheel_sessions')
      .update({
        spins_used: nextSpins,
        active_discount: wonPercent,
        discount_code: discountCode,
        consumed: false,
        ip_hash: ipHash,
        last_spin_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', current.id)
      .select('*')
      .single()

    if (updateError) {
      return Response.json({ success: false, error: updateError.message }, { status: 500 })
    }

    const status = buildPublicStatus(updated, dayKey)
    return Response.json({ success: true, wonPercent, ...status })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
