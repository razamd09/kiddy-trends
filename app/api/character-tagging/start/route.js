import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { requireAdmin } from '../../../../lib/requireAdmin'

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const force = body?.force === true
  let query = supabaseAdmin.from('products').select('id, character_review_status')
  if (!force) query = query.or('character_review_status.is.null,character_review_status.eq.untagged')

  const { data: products, error: productsError } = await query
  if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 })

  if (!products || products.length === 0) return NextResponse.json({ error: 'No products need tagging.' }, { status: 400 })

  const { data: job, error: jobError } = await supabaseAdmin
    .from('character_tagging_jobs')
    .insert({ total_products: products.length, status: 'running' })
    .select()
    .single()
  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 })

  const { error: itemsError } = await supabaseAdmin.from('character_tagging_job_items').insert(
    products.map((product) => ({ job_id: job.id, product_id: product.id, status: 'pending' }))
  )
  if (itemsError) {
    await supabaseAdmin.from('character_tagging_jobs').delete().eq('id', job.id)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ jobId: job.id, totalProducts: products.length })
}