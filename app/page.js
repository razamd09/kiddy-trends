import HomeClient from './HomeClient'

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

async function getInitialInstagramPosts() {
  try {
    const res = await fetch(SITE_URL + '/api/instagram-feed', { next: { revalidate: 3600 } })
    const data = await res.json()
    return data.success ? (data.posts || []) : []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [initialProducts, initialInstagramPosts] = await Promise.all([
    getInitialProducts(),
    getInitialInstagramPosts(),
  ])
  return <HomeClient initialProducts={initialProducts} initialInstagramPosts={initialInstagramPosts} />
}
