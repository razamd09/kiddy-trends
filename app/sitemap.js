import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://thekiddytrends.com'
const DRAFT_SOURCE = 'draft_workspace'

export default async function sitemap() {
  const staticRoutes = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: SITE_URL + '/collections', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: SITE_URL + '/brands', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: SITE_URL + '/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: SITE_URL + '/faq', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: SITE_URL + '/refund-policy', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: SITE_URL + '/size-chart', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  let productRoutes = []
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )

    const { data, error } = await supabase
      .from('products')
      .select('id, updated_at, created_at')
      .eq('is_active', true)
      .or('source.is.null,source.neq.' + DRAFT_SOURCE)
      .limit(5000)

    if (!error && Array.isArray(data)) {
      productRoutes = data.map((product) => ({
        url: SITE_URL + '/products/prd_id=' + product.id,
        lastModified: product.updated_at ? new Date(product.updated_at) : (product.created_at ? new Date(product.created_at) : new Date()),
        changeFrequency: 'weekly',
        priority: 0.8,
      }))
    }
  } catch {}

  return [...staticRoutes, ...productRoutes]
}
