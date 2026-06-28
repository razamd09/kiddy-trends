import { createClient } from '@supabase/supabase-js'

// Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node update_product_versions.js

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchAllProducts() {
  const products = []
  let from = 0
  const pageSize = 500

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, product_version')
      .range(from, from + pageSize - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    products.push(...data)
    from += pageSize
    if (data.length < pageSize) break
  }

  return products
}

function decideVersion(title) {
  const t = String(title || '').toLowerCase()
  if (t.includes('summer new arrival 2026')) return 'new arrivals'
  return 'Old Packs'
}

async function main() {
  try {
    console.log('Fetching products...')
    const products = await fetchAllProducts()
    console.log(`Fetched ${products.length} products`)

    const toUpdate = []
    for (const p of products) {
      const desired = decideVersion(p.title)
      const current = p.product_version || ''
      if (String(current).trim() !== desired) {
        toUpdate.push({ id: p.id, product_version: desired })
      }
    }

    console.log(`Will update ${toUpdate.length} products`)

    for (const item of toUpdate) {
      const { data, error } = await supabase
        .from('products')
        .update({ product_version: item.product_version, updated_at: new Date().toISOString() })
        .eq('id', item.id)

      if (error) {
        console.error('Failed updating', item.id, error.message)
      }
    }

    console.log('Done')
  } catch (err) {
    console.error(err.message || err)
    process.exit(1)
  }
}

main()
