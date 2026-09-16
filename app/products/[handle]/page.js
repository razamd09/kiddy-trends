import ProductPageClient from './ProductPageClient'

const SITE_URL = 'https://thekiddytrends.com'

function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalizeDisplayTitle(rawTitle) {
  return String(rawTitle || '')
    .replace(/^\s*#?\s*Kids\s+Affordable\s+Collection\s*(?:2026)?\s*[:\-]*\s*/i, '')
    .replace(/^\s*#\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function getProduct(handle) {
  try {
    const res = await fetch(SITE_URL + '/api/products?handle=' + encodeURIComponent(handle), { cache: 'no-store' })
    const data = await res.json()
    let product = data.success && data.products?.length > 0 ? data.products[0] : null

    if (!product && /^prd_id\s*=\s*\d+$/i.test(String(handle || ''))) {
      const productId = Number(String(handle).split('=').pop())
      const fallbackRes = await fetch(SITE_URL + '/api/products?limit=400', { cache: 'no-store' })
      const fallbackData = await fallbackRes.json()
      product = (fallbackData.products || []).find((candidate) =>
        Number(candidate?._id) === productId || Number(candidate?.id) === productId
      ) || null
    }

    return product
  } catch {
    return null
  }
}

export async function generateMetadata({ params }) {
  const { handle } = await params
  const canonical = '/products/' + handle
  const product = await getProduct(handle)

  if (!product) {
    return {
      title: 'Product Not Found | Kiddy Trends',
      alternates: { canonical },
    }
  }

  const displayTitle = normalizeDisplayTitle(product.title)
  const title = displayTitle + ' | Kiddy Trends'
  const rawDescription = stripHtml(product.description)
  const description = rawDescription
    ? rawDescription.slice(0, 155)
    : 'Shop ' + displayTitle + ' at Kiddy Trends — cute, affordable kids clothing with Cash on Delivery across Pakistan.'
  const image = product.images?.[0]?.src

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: SITE_URL + canonical,
      siteName: 'Kiddy Trends',
      images: image ? [{ url: image, width: 800, height: 800, alt: displayTitle }] : undefined,
      locale: 'en_PK',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

async function getReviewStats(productId) {
  try {
    const res = await fetch(SITE_URL + '/api/reviews?productId=' + productId, { cache: 'no-store' })
    const data = await res.json()
    return data.success ? { count: data.count || 0, averageRating: data.averageRating || 0 } : null
  } catch {
    return null
  }
}

export default async function ProductPage({ params }) {
  const { handle } = await params
  const product = await getProduct(handle)
  const reviewStats = product ? await getReviewStats(product._id || product.id) : null

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: normalizeDisplayTitle(product.title),
    description: stripHtml(product.description).slice(0, 5000) || undefined,
    image: (product.images || []).map((img) => SITE_URL + img.src),
    sku: String(product._id || product.id || ''),
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    offers: {
      '@type': 'Offer',
      url: SITE_URL + '/products/' + handle,
      priceCurrency: 'PKR',
      price: String(product.variants?.[0]?.price || '0'),
      availability: (product.variants || []).some((v) => v.available)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    // Only include real, customer-submitted ratings — never fabricated data.
    aggregateRating: reviewStats && reviewStats.count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: String(reviewStats.averageRating),
      reviewCount: String(reviewStats.count),
    } : undefined,
  } : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductPageClient initialProduct={product} />
    </>
  )
}
