import { Suspense } from 'react'
import CampaignPageClient from '../../components/CampaignPageClient'

const SITE_URL = 'https://thekiddytrends.com'
const CAMPAIGN_NUMBER = 2

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

async function getInitialPinnedIds() {
  try {
    const res = await fetch(SITE_URL + '/api/campaign-slots?campaign=' + CAMPAIGN_NUMBER, { next: { revalidate: 60 } })
    const data = await res.json()
    return data.success ? (data.productIds || []) : []
  } catch {
    return []
  }
}

export default async function Campaign2Page() {
  const [initialProducts, initialPinnedIds] = await Promise.all([getInitialProducts(), getInitialPinnedIds()])

  return (
    <Suspense fallback={null}>
      <CampaignPageClient campaignNumber={CAMPAIGN_NUMBER} initialProducts={initialProducts} initialPinnedIds={initialPinnedIds} />
    </Suspense>
  )
}
