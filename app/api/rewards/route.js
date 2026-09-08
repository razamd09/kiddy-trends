import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export const dynamic = 'force-dynamic'

const POINTS_PER_1000 = 25
const BONUS_THRESHOLD = 500
const BONUS_POINTS    = 100

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('92') && digits.length > 10) digits = digits.slice(2)
  if (digits.startsWith('0') && digits.length > 10) digits = digits.slice(1)
  if (digits.length !== 10) return ''
  return '+92' + digits
}

// GET — fetch rewards account by phone
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const phone = normalizePhone(searchParams.get('phone'))
  if (!phone) return Response.json({ error: 'Valid 10-digit phone required' }, { status: 400 })

  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('phone', phone)
    .single()

  if (error || !data) {
    return Response.json({ exists: false }, { headers: { 'Cache-Control': 'no-store' } })
  }
  return Response.json({ exists: true, ...data }, { headers: { 'Cache-Control': 'no-store' } })
}

// POST — auto-enroll a phone number into rewards (0 points, no separate signup step)
export async function POST(request) {
  const { phone: rawPhone, name, whatsapp } = await request.json()
  const phone = normalizePhone(rawPhone)
  if (!phone) return Response.json({ error: 'Valid 10-digit phone required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('rewards')
    .select('phone')
    .eq('phone', phone)
    .single()

  if (existing) return Response.json({ error: 'Rewards account already exists for this phone' }, { status: 409 })

  const { data, error } = await supabase
    .from('rewards')
    .insert([{ user_id: phone, phone, name: name || '', whatsapp: whatsapp || phone, points: 0, total_spent: 0 }])
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true, ...data })
}

// PUT — add points after purchase
export async function PUT(request) {
  const { phone: rawPhone, orderTotal } = await request.json()
  const phone = normalizePhone(rawPhone)
  if (!phone) return Response.json({ error: 'Valid 10-digit phone required' }, { status: 400 })

  const { data: user } = await supabase
    .from('rewards')
    .select('*')
    .eq('phone', phone)
    .single()

  if (!user) return Response.json({ error: 'Rewards account not found' }, { status: 404 })

  const earnedPoints  = Math.floor(orderTotal / 1000) * POINTS_PER_1000
  const newPoints     = user.points + earnedPoints
  const newSpent      = user.total_spent + orderTotal
  let bonusAwarded    = false

  let finalPoints = newPoints
  if (newPoints >= BONUS_THRESHOLD && !user.bonus_notified) {
    finalPoints     = newPoints + BONUS_POINTS
    bonusAwarded    = true
  }

  const { data, error } = await supabase
    .from('rewards')
    .update({
      points:          finalPoints,
      total_spent:     newSpent,
      bonus_notified:  bonusAwarded ? true : user.bonus_notified,
      updated_at:      new Date().toISOString(),
    })
    .eq('phone', phone)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true, earned: earnedPoints, bonus: bonusAwarded, ...data })
}

// PATCH — redeem points
export async function PATCH(request) {
  const { phone: rawPhone, redeemPoints } = await request.json()
  const phone = normalizePhone(rawPhone)
  if (!phone) return Response.json({ error: 'Valid 10-digit phone required' }, { status: 400 })

  const { data: user } = await supabase
    .from('rewards')
    .select('*')
    .eq('phone', phone)
    .single()

  if (!user) return Response.json({ error: 'Rewards account not found' }, { status: 404 })
  if (user.points <= 0 || redeemPoints <= 0) return Response.json({ error: 'No points to redeem' }, { status: 400 })

  const { data, error } = await supabase
    .from('rewards')
    .update({
      points:     0,
      updated_at: new Date().toISOString(),
    })
    .eq('phone', phone)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true, discount: user.points, redeemedPoints: user.points, ...data })
}
