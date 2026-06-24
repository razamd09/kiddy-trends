import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const POINTS_PER_1000 = 10
const BONUS_THRESHOLD = 500
const BONUS_POINTS    = 100

// GET — fetch user by ID
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')?.toLowerCase().trim()
  if (!userId) return Response.json({ error: 'User ID required' }, { status: 400 })

  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return Response.json({ exists: false })
  return Response.json({ exists: true, ...data })
}

// POST — create user
export async function POST(request) {
  const { userId, name, phone } = await request.json()
  const id = userId?.toLowerCase().trim()
  if (!id) return Response.json({ error: 'User ID required' }, { status: 400 })

  // Check if exists
  const { data: existing } = await supabase
    .from('rewards')
    .select('user_id')
    .eq('user_id', id)
    .single()

  if (existing) return Response.json({ error: 'User ID already taken' }, { status: 409 })

  const { data, error } = await supabase
    .from('rewards')
    .insert([{ user_id: id, name, phone, points: 0, total_spent: 0 }])
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true, ...data })
}

// PUT — add points after purchase
export async function PUT(request) {
  const { userId, orderTotal } = await request.json()
  const id = userId?.toLowerCase().trim()

  const { data: user } = await supabase
    .from('rewards')
    .select('*')
    .eq('user_id', id)
    .single()

  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const earnedPoints  = Math.floor(orderTotal / 1000) * POINTS_PER_1000
  const newPoints     = user.points + earnedPoints
  const newSpent      = user.total_spent + orderTotal
  let bonusAwarded    = false

  // Check bonus threshold
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
    .eq('user_id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true, earned: earnedPoints, bonus: bonusAwarded, ...data })
}

// PATCH — redeem points
export async function PATCH(request) {
  const { userId, redeemPoints } = await request.json()
  const id = userId?.toLowerCase().trim()

  const { data: user } = await supabase
    .from('rewards')
    .select('*')
    .eq('user_id', id)
    .single()

  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })
  if (user.points < redeemPoints) return Response.json({ error: 'Not enough points' }, { status: 400 })

  const { data, error } = await supabase
    .from('rewards')
    .update({
      points:     user.points - redeemPoints,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true, discount: redeemPoints, ...data })
}