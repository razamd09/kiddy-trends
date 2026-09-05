import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { requireAdmin } from '../../../../lib/requireAdmin'

function firstImage(images) {
  if (Array.isArray(images)) {
    const image = images.find((entry) => typeof entry === 'string' ? entry.trim() : entry?.src)
    return typeof image === 'string' ? image : image?.src || ''
  }
  return typeof images === 'string' ? images.trim() : ''
}

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
  const offset = Number(searchParams.get('offset')) || 0
  const origin = new URL(request.url).origin
  const { data, error, count } = await supabaseAdmin
    .from('products')
    .select('id, title, images, characters, character_suggestions', { count: 'exact' })
    .eq('character_review_status', 'needs_review')
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const items = (data || []).map((item) => ({
    ...item,
    name: item.title,
    image_url: firstImage(item.images).startsWith('http')
      ? firstImage(item.images)
      : firstImage(item.images) ? origin + '/api/image?src=' + encodeURIComponent(firstImage(item.images)) : '',
  }))
  return NextResponse.json({ items, total: count || 0 })
}