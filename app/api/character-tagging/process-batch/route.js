import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { requireAdmin } from '../../../../lib/requireAdmin'
import { classifyProductImage } from '../../../../lib/anthropicVision'
import { BATCH_SIZE, AUTO_APPLY_CONFIDENCE_THRESHOLD } from '../../../../lib/characters'

export const maxDuration = 60

function firstImage(images) {
  if (typeof images === 'string') {
    const trimmed = images.trim()
    if (!trimmed) return ''
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed !== images) return firstImage(parsed)
    } catch {}
    return trimmed
  }
  if (Array.isArray(images)) {
    const image = images.find((entry) => typeof entry === 'string' ? entry.trim() : entry?.src)
    return typeof image === 'string' ? image : image?.src || ''
  }
  return typeof images === 'string' ? images.trim() : ''
}

function absoluteImageUrl(value, origin) {
  const image = String(value || '').trim()
  if (!image) return ''
  if (/^https?:\/\//i.test(image)) return image
  return origin + '/api/image?src=' + encodeURIComponent(image)
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobId } = await request.json().catch(() => ({}))
  if (!jobId) return NextResponse.json({ error: 'jobId is required' }, { status: 400 })

  const { data: claimed, error: claimError } = await supabaseAdmin
    .rpc('claim_character_tagging_items', { p_job_id: jobId, p_limit: BATCH_SIZE })
  if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 })

  if (!claimed || claimed.length === 0) {
    const { data: job } = await supabaseAdmin.from('character_tagging_jobs').select('*').eq('id', jobId).single()
    if (job?.status === 'running') {
      await supabaseAdmin.from('character_tagging_jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', jobId)
    }
    return NextResponse.json({ done: true, job })
  }

  const { data: products, error: productsError } = await supabaseAdmin
    .from('products').select('id, images').in('id', claimed.map((item) => item.product_id))
  if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 })

  const productById = Object.fromEntries((products || []).map((product) => [product.id, product]))
  const origin = new URL(request.url).origin
  let autoTagged = 0
  let needsReview = 0
  let failed = 0
  const errors = []

  await Promise.all(claimed.map(async (item) => {
    const product = productById[item.product_id]
    const nowIso = new Date().toISOString()
    const imageUrl = absoluteImageUrl(firstImage(product?.images), origin)
    if (!imageUrl) {
      failed += 1
      errors.push('Product ' + item.product_id + ': no usable image')
      await supabaseAdmin.from('character_tagging_job_items').update({ status: 'failed', error: 'Product has no image', processed_at: nowIso, attempts: (item.attempts || 0) + 1 }).eq('id', item.id)
      return
    }

    try {
      const result = await classifyProductImage(imageUrl)
      const isConfident = result.characters.length > 0 && result.confidence >= AUTO_APPLY_CONFIDENCE_THRESHOLD
      const productUpdate = { character_suggestions: result, character_review_status: isConfident ? 'auto_tagged' : 'needs_review', character_tagged_at: nowIso }
      if (isConfident) productUpdate.characters = result.characters
      const { error: productUpdateError } = await supabaseAdmin.from('products').update(productUpdate).eq('id', product.id)
      if (productUpdateError) throw productUpdateError
      await supabaseAdmin.from('character_tagging_job_items').update({ status: 'done', result, processed_at: nowIso, attempts: (item.attempts || 0) + 1 }).eq('id', item.id)
      if (isConfident) autoTagged += 1
      else needsReview += 1
    } catch (error) {
      failed += 1
      errors.push('Product ' + item.product_id + ': ' + String(error?.message || error).slice(0, 240))
      await supabaseAdmin.from('character_tagging_job_items').update({ status: 'failed', error: String(error?.message || error), processed_at: nowIso, attempts: (item.attempts || 0) + 1 }).eq('id', item.id)
    }
  }))

  const { data: updatedJob } = await supabaseAdmin.rpc('increment_character_job_progress', { p_job_id: jobId, p_processed: claimed.length, p_auto_tagged: autoTagged, p_needs_review: needsReview, p_failed: failed })
  return NextResponse.json({ done: false, job: updatedJob?.[0] || null, errors })
}