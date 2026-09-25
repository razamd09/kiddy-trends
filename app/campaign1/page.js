import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import CampaignPageClient from '../../components/CampaignPageClient'

const SITE_URL = 'https://thekiddytrends.com'
const CAMPAIGN_NUMBER = 1

export const metadata = {
  title: 'Featured Collection – Kiddy Trends',
  description: 'Shop our featured collection at Kiddy Trends, plus explore more kids clothing, bedding, bags and accessories.',
  robots: { index: false, follow: true },
}

async function getInitialProducts() {
  try {
    const res = await fetch(SITE_URL + '/api/products?limit=400&page=1', { next: { revalidate: 60 } })
    const data = await res.json()
    return data.success ? (data.products || []) : []
  } catch {
    return []
  }
}

// active === false means this campaign slot is toggled off in
// /admin/campaigns — the page must not be live even though the route exists.
async function getInitialCampaignState() {
  try {
    const res = await fetch(SITE_URL + '/api/campaign-slots?campaign=' + CAMPAIGN_NUMBER, { cache: 'no-store' })
    const data = await res.json()
    return { active: data.success ? data.active !== false : false, productIds: data.success ? (data.productIds || []) : [] }
  } catch {
    return { active: false, productIds: [] }
  }
}

export default async function Campaign1Page() {
  const [initialProducts, campaignState] = await Promise.all([getInitialProducts(), getInitialCampaignState()])
  if (!campaignState.active) notFound()

  return (
    <Suspense fallback={null}>
      <CampaignPageClient campaignNumber={CAMPAIGN_NUMBER} initialProducts={initialProducts} initialPinnedIds={campaignState.productIds} />
    </Suspense>
  )
}
