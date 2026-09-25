import { Suspense } from 'react'
import CollectionsClient from './CollectionsClient'

const SITE_URL = 'https://thekiddytrends.com'

// Collections' filtering (age/gender/category/season/version/search) all
// happens client-side over the full catalog, so it genuinely needs every
// product — but fetching all pages here (server-side, cached 60s at the
// edge) instead of leaving it to the client is what matters for
// performance: it used to be redone, unfiltered, on every visitor's browser
// on every page load.
async function getInitialProducts() {
  try {
    const first = await fetch(SITE_URL + '/api/products?limit=400&page=1', { next: { revalidate: 60 } }).then((r) => r.json())
    if (!first.success) return []
    const totalPages = Math.max(first.pages || 1, 1)
    const restPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        fetch(SITE_URL + '/api/products?limit=400&page=' + (i + 2), { next: { revalidate: 60 } }).then((r) => r.json())
      )
    )
    return [...(first.products || []), ...restPages.flatMap((p) => (p.success ? p.products || [] : []))]
  } catch {
    return []
  }
}

export default async function CollectionsPage() {
  const initialProducts = await getInitialProducts()

  return (
    <Suspense fallback={null}>
      <CollectionsClient initialProducts={initialProducts} />
    </Suspense>
  )
}
