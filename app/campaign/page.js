import { Suspense } from 'react'
import CampaignClient from './CampaignClient'

const SITE_URL = 'https://thekiddytrends.com'

export const metadata = {
  title: 'Featured Collection – Kiddy Trends',
  description: 'Shop our featured collection at Kiddy Trends, plus explore more kids clothing, bedding, bags and accessories.',
  robots: { index: false, follow: true },
}

// This page mixes campaign_tier-tagged products (any version) with
// new-arrival and old-pack winter items, so — unlike /campaign1-10, which
// only ever need the New Arrivals pool — it genuinely needs the whole
// catalog. Fetching every page here (server-side, cached 60s at the edge)
// instead of leaving that to the client is what actually matters for
// performance: it used to be redone unfiltered on every visitor's browser.
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

export default async function CampaignPage() {
  const initialProducts = await getInitialProducts()

  return (
    <Suspense fallback={null}>
      <CampaignClient initialProducts={initialProducts} />
    </Suspense>
  )
}
