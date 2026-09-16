import { Suspense } from 'react'
import CollectionsClient from './CollectionsClient'

const SITE_URL = 'https://thekiddytrends.com'

async function getInitialProducts() {
  try {
    const res = await fetch(SITE_URL + '/api/products?limit=400&page=1', { next: { revalidate: 60 } })
    const data = await res.json()
    return data.success ? (data.products || []) : []
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
