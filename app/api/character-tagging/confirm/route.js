import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { requireAdmin } from '../../../../lib/requireAdmin'
import { isValidCharacterSlug } from '../../../../lib/characters'

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { productId, characters } = await request.json().catch(() => ({}))
  if (!productId || !Array.isArray(characters)) return NextResponse.json({ error: 'productId and characters[] are required' }, { status: 400 })
  const invalidSlug = characters.find((slug) => !isValidCharacterSlug(slug))
  if (invalidSlug) return NextResponse.json({ error: `Unknown character slug: ${invalidSlug}` }, { status: 400 })

  const { error } = await supabaseAdmin.from('products').update({ characters, character_review_status: 'confirmed', character_tagged_at: new Date().toISOString() }).eq('id', productId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}