import { Suspense } from 'react'
import CampaignClient from './CampaignClient'

const SITE_URL = 'https://thekiddytrends.com'

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

export default async function CampaignPage() {
  const initialProducts = await getInitialProducts()

  return (
    <Suspense fallback={null}>
      <CampaignClient initialProducts={initialProducts} />
    </Suspense>
  )
}
