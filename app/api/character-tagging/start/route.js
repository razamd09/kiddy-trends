import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { requireAdmin } from '../../../../lib/requireAdmin'

function hasProductImage(images) {
  if (typeof images === 'string') {
    const trimmed = images.trim()
    if (!trimmed) return false
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed !== images) return hasProductImage(parsed)
    } catch {}
    return true
  }
  if (Array.isArray(images)) return images.some((image) => typeof image === 'string' ? image.trim() : image?.src)
  return typeof images === 'string' && images.trim().length > 0
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const force = body?.force === true
  let query = supabaseAdmin.from('products').select('id, images, character_review_status')
  if (!force) query = query.or('character_review_status.is.null,character_review_status.eq.untagged')

  const { data: products, error: productsError } = await query
  if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 })

  const productsWithImages = (products || []).filter((product) => hasProductImage(product.images))
  if (productsWithImages.length === 0) return NextResponse.json({ error: 'No products with images need tagging.' }, { status: 400 })

  const { data: job, error: jobError } = await supabaseAdmin
    .from('character_tagging_jobs')
    .insert({ total_products: productsWithImages.length, status: 'running' })
    .select()
    .single()
  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 })

  const { error: itemsError } = await supabaseAdmin.from('character_tagging_job_items').insert(
    productsWithImages.map((product) => ({ job_id: job.id, product_id: product.id, status: 'pending' }))
  )
  if (itemsError) {
    await supabaseAdmin.from('character_tagging_jobs').delete().eq('id', job.id)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ jobId: job.id, totalProducts: productsWithImages.length })
}