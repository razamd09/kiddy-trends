'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '../../../components/ProductCard'
import { useCart } from '../../../context/CartContext'
import CheckoutModal from '../../../components/CheckoutModal'
import RecentlyViewed from '../../../components/RecentlyViewed'
import SizeRecommender from '../../../components/SizeRecommender'

const STORE_DOMAIN = 'the-kiddy-trends.myshopify.com'

const girlReviewers = [
  { name: 'Ayesha K.',   city: 'Lahore',      review: 'Love this product! The fabric is so soft and my daughter absolutely adores it. Will definitely order again!' },
  { name: 'Sana M.',     city: 'Karachi',     review: 'Amazing quality for the price. The colors are exactly as shown. My daughter looks so cute in it!' },
  { name: 'Fatima R.',   city: 'Islamabad',   review: 'Ordered for my 4 year old and she loves it. Super soft material and fits perfectly. Great value!' },
  { name: 'Nadia A.',    city: 'Faisalabad',  review: 'Very happy with this purchase. Fast delivery and quality is better than expected. My daughter wears it every day!' },
  { name: 'Hina S.',     city: 'Multan',      review: 'Beautiful design and excellent quality. My little girl looks adorable in this. Will order more!' },
  { name: 'Zara T.',     city: 'Rawalpindi',  review: 'So cute and affordable! My daughter gets compliments every time she wears it. Highly recommended!' },
  { name: 'Maria B.',    city: 'Sialkot',     review: 'Great product! My daughter wears it all day without any discomfort. The fabric is so soft!' },
  { name: 'Amna Q.',     city: 'Peshawar',    review: 'Excellent quality at such an affordable price. My princess loves it. Very happy customer!' },
  { name: 'Rabia N.',    city: 'Gujranwala',  review: 'My 6 year old daughter keeps asking to wear this every day. Super soft and durable fabric!' },
  { name: 'Saima H.',    city: 'Quetta',      review: 'Very satisfied with this order. My daughter looked so beautiful in it. Definitely buying more!' },
  { name: 'Uzma F.',     city: 'Lahore',      review: 'Kiddy Trends never disappoints! My daughter absolutely loves this outfit. Amazing quality!' },
  { name: 'Asma I.',     city: 'Karachi',     review: 'My daughter loves this so much! The colors are vibrant and the fabric is very soft.' },
  { name: 'Bushra W.',   city: 'Hyderabad',   review: 'Really good quality. Fits well and looks adorable on my little girl. Will recommend to friends!' },
  { name: 'Maham J.',    city: 'Bahawalpur',  review: 'My daughter looks so cute in this. Premium quality and very comfortable for daily wear.' },
  { name: 'Shazia K.',   city: 'Sahiwal',     review: 'Amazing value! My daughter absolutely loves this dress. Fast delivery and nice packaging too.' },
  { name: 'Rukhsar A.',  city: 'Multan',      review: 'Bought this for my 5 year old daughter. She refused to take it off! Great quality product.' },
  { name: 'Mehwish T.',  city: 'Lahore',      review: 'My little girl is obsessed with this outfit. The color is gorgeous and fabric is very soft!' },
  { name: 'Nabeela R.',  city: 'Karachi',     review: 'Ordered for my daughter and she was so happy! The quality is outstanding for this price.' },
  { name: 'Sobia Q.',    city: 'Islamabad',   review: 'Beautiful outfit for my daughter. She looks like a princess in it. Will definitely reorder!' },
  { name: 'Tayyaba M.',  city: 'Rawalpindi',  review: 'My daughter gets so many compliments wearing this. Absolutely love the quality and design!' },
  { name: 'Iqra S.',     city: 'Faisalabad',  review: 'Excellent purchase! My daughter wore it to a party and everyone asked where I got it from!' },
  { name: 'Lubna H.',    city: 'Gujranwala',  review: 'Very happy with this. My daughter loves the colors and it fits her perfectly. Great product!' },
  { name: 'Kiran N.',    city: 'Sialkot',     review: 'Such a lovely outfit for my little girl. Super soft material and the design is beautiful!' },
  { name: 'Amber Z.',    city: 'Peshawar',    review: 'My daughter absolutely loves this! Great quality for the price. Will order again for sure!' },
  { name: 'Noor F.',     city: 'Quetta',      review: 'Bought this for my 3 year old daughter. She loves it and it fits perfectly. Highly recommended!' },
]

const boyReviewers = [
  { name: 'Sadia A.',    city: 'Lahore',      review: 'My son loves this outfit! The fabric is very comfortable and he wears it all day long.' },
  { name: 'Uzma K.',     city: 'Karachi',     review: 'Amazing quality for the price. My son looks so handsome in this. Fast delivery too!' },
  { name: 'Hira R.',     city: 'Islamabad',   review: 'Ordered for my 5 year old son and he loves it. Super soft material and fits perfectly!' },
  { name: 'Samina B.',   city: 'Faisalabad',  review: 'Very happy with this purchase. My son wears this to school and gets lots of compliments!' },
  { name: 'Nazia H.',    city: 'Multan',      review: 'Excellent quality! My son refused to wear anything else after getting this. Highly recommended!' },
  { name: 'Farah T.',    city: 'Rawalpindi',  review: 'So comfortable and affordable! My son loves the colors. Packaging was also very neat.' },
  { name: 'Shabana B.',  city: 'Sialkot',     review: 'Great product! My son wears it every day. Very durable and the stitching is excellent!' },
  { name: 'Parveen Q.',  city: 'Peshawar',    review: 'Excellent quality at such an affordable price. My son looks so smart in this outfit!' },
  { name: 'Nasreen N.',  city: 'Gujranwala',  review: 'My 7 year old son keeps asking to wear this every day. Super soft and very durable!' },
  { name: 'Shahida H.',  city: 'Quetta',      review: 'Very satisfied with this order. My son loved it immediately. Definitely buying more!' },
  { name: 'Razia F.',    city: 'Lahore',      review: 'Kiddy Trends never disappoints! My son absolutely loves this outfit. Consistent quality!' },
  { name: 'Yasmeen I.',  city: 'Karachi',     review: 'My son loves this so much! Great colors and very soft fabric. Excellent purchase overall.' },
  { name: 'Farhat W.',   city: 'Hyderabad',   review: 'Really good quality. Fits my son perfectly and looks very smart. Will recommend to all moms!' },
  { name: 'Zeenat J.',   city: 'Bahawalpur',  review: 'My son looks so handsome in this. Premium quality and very comfortable for daily wear.' },
  { name: 'Gulnaz K.',   city: 'Sahiwal',     review: 'Amazing value! My son loves this outfit. Fast delivery and very nice quality packaging.' },
  { name: 'Rizwana A.',  city: 'Multan',      review: 'Bought this for my 6 year old son. He refused to take it off! Brilliant quality product.' },
  { name: 'Tahira T.',   city: 'Lahore',      review: 'My little boy is obsessed with this outfit. The color is perfect and fabric is very soft!' },
  { name: 'Azra R.',     city: 'Karachi',     review: 'Ordered for my son and he was so happy! Outstanding quality for this price range.' },
  { name: 'Rubina Q.',   city: 'Islamabad',   review: 'Great outfit for my son. He looks so smart in it. Will definitely reorder next size!' },
  { name: 'Mehnaz M.',   city: 'Rawalpindi',  review: 'My son gets so many compliments wearing this. Love the quality and the design is perfect!' },
  { name: 'Sajida S.',   city: 'Faisalabad',  review: 'Excellent purchase! My son wore it to school and his teacher asked where I bought it from!' },
  { name: 'Hamida H.',   city: 'Gujranwala',  review: 'Very happy with this. My son loves it and it fits him perfectly. Great product overall!' },
  { name: 'Zubaida N.',  city: 'Sialkot',     review: 'Such a lovely outfit for my little boy. Super soft material and the design is very smart!' },
  { name: 'Shakeela Z.', city: 'Peshawar',    review: 'My son absolutely loves this! Great quality for the price. Will definitely order again!' },
  { name: 'Mumtaz F.',   city: 'Quetta',      review: 'Bought this for my 4 year old son. He loves it and it fits perfectly. Highly recommended!' },
]

const neutralReviewers = [
  { name: 'Ayesha K.',  city: 'Lahore',     review: 'Amazing quality for the price! The product looks exactly as shown. Fast delivery too. Highly recommended!' },
  { name: 'Sana M.',    city: 'Karachi',    review: 'Very satisfied with this purchase. Great value for money and the quality is excellent!' },
  { name: 'Fatima R.',  city: 'Islamabad',  review: 'Excellent product! Super soft material and very durable. Will definitely order again!' },
  { name: 'Nadia A.',   city: 'Faisalabad', review: 'Very happy with this purchase. Fast delivery and quality is much better than expected!' },
  { name: 'Hina S.',    city: 'Multan',     review: 'Beautiful design and excellent quality. The fabric is breathable and very comfortable!' },
  { name: 'Uzma F.',    city: 'Lahore',     review: 'Kiddy Trends never disappoints! Consistent quality every time. Will keep ordering!' },
  { name: 'Rabia N.',   city: 'Gujranwala', review: 'Super soft and durable fabric. Great value for money. Packaging was also very neat!' },
  { name: 'Saima H.',   city: 'Quetta',     review: 'Very satisfied with this order. Product exactly as described and delivery was quick!' },
]

function getProductReviews(productId, title) {
  const seed = productId % 100
  if (seed > 50) return null
  const titleLower = (title || '').toLowerCase()
  const isBoy  = titleLower.includes('boy') || titleLower.includes('boys')
  const isGirl = titleLower.includes('girl') || titleLower.includes('girls') ||
                 titleLower.includes('frock') || titleLower.includes('dress')
  const pool     = isBoy ? boyReviewers : isGirl ? girlReviewers : neutralReviewers
  const count    = (productId % 3) + 1
  const startIdx = productId % pool.length
  const selected = []
  for (let i = 0; i < count; i++) {
    selected.push(pool[(startIdx + i) % pool.length])
  }
  const rating = (productId % 2 === 0) ? 5 : 4
  return { rating, reviews: selected }
}

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(star => (
        <svg key={star} className={'w-4 h-4 ' + (star <= rating ? 'text-yellow-400' : 'text-gray-200')}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function ProductPage() {
  const { handle } = useParams()
  const { addToCart, cart } = useCart()

  const [product, setProduct]                 = useState(null)
  const [related, setRelated]                 = useState([])
  const [loading, setLoading]                 = useState(true)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedImage, setSelectedImage]     = useState(0)
  const [added, setAdded]                     = useState(false)
  const [showCheckout, setShowCheckout]       = useState(false)
  const [showSizeChart, setShowSizeChart]     = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res  = await fetch('https://' + STORE_DOMAIN + '/products/' + handle + '.json')
        const data = await res.json()
        if (data.product) {
  setProduct(data.product)
  setSelectedVariant(data.product.variants?.[0])
  // Save to recently viewed
  try {
    const stored = JSON.parse(localStorage.getItem('recently_viewed') || '[]')
    const filtered = stored.filter(p => p.id !== data.product.id)
    const updated = [data.product, ...filtered].slice(0, 10)
    localStorage.setItem('recently_viewed', JSON.stringify(updated))
  } catch {}
}
        setLoading(false)
      } catch { setLoading(false) }
    }
    if (handle) fetchProduct()
  }, [handle])

  useEffect(() => {
    async function fetchRelated() {
      if (!product) return
      try {
        const res  = await fetch('https://' + STORE_DOMAIN + '/products.json?limit=250')
        const data = await res.json()
        const type = (product.product_type || '').toLowerCase()
        const productTags = typeof product.tags === 'string'
          ? product.tags.split(',').map(t => t.trim())
          : (product.tags || [])
        const filtered = (data.products || [])
          .filter(p => {
            if (p.id === product.id) return false
            const pTags = typeof p.tags === 'string'
              ? p.tags.split(',').map(t => t.trim())
              : (p.tags || [])
            return (p.product_type || '').toLowerCase() === type ||
              pTags.some(t => productTags.includes(t))
          })
          .slice(0, 4)
        setRelated(filtered)
      } catch {}
    }
    fetchRelated()
  }, [product])

  const price      = parseFloat(selectedVariant?.price || 0)
  const comparePrice = parseFloat(selectedVariant?.compare_at_price || 0)
  const isSoldOut  = false
  const inCart     = cart.find(i => i.variantId === selectedVariant?.id)?.quantity || 0
  const isMaxed    = inCart >= 2

  const discountPct = (() => {
    const type  = (product?.product_type || '').toLowerCase()
    const title = (product?.title || '').toLowerCase()
    if (type.includes('bag') || title.includes('bag')) return 25
    if (type.includes('bed') || title.includes('bed')) return 30
    if (type.includes('access') || title.includes('pin') || title.includes('hair')) return 20
    return 50
  })()

  const fakeOriginal = comparePrice > price
    ? comparePrice
    : Math.round(price * (1 + discountPct / 100) / 100) * 100

  const lowStock = (() => {
    const seed = product?.id % 10
    if (!product || seed > 4) return null
    return [1,2,3,2,1,3,2,1,3,2][seed]
  })()

  const hasVariants = product?.variants?.length > 1 &&
    !(product?.variants?.length === 1 && product?.variants[0]?.title === 'Default Title')

  function handleAddToCart() {
    if (isSoldOut || isMaxed) return
    addToCart(product, selectedVariant, 2, true)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-2 gap-10 animate-pulse">
        <div className="bg-gray-100 rounded-3xl aspect-square" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded w-3/4" />
          <div className="h-6 bg-gray-100 rounded w-1/4" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="text-6xl mb-4">😕</div>
      <h2 className="font-display text-3xl text-charcoal mb-4">Product not found</h2>
      <Link href="/collections" className="btn-primary">Back to Collections</Link>
    </div>
  )

  const productTags = typeof product.tags === 'string'
    ? product.tags.split(',').map(t => t.trim()).filter(Boolean)
    : (product.tags || [])
  const reviewData = getProductReviews(product.id, product.title)

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-coral transition-colors">Home</Link>
          <span>›</span>
          <Link href="/collections" className="hover:text-coral transition-colors">Collections</Link>
          <span>›</span>
          <span className="text-charcoal font-semibold truncate max-w-xs">{product.title}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 mb-16">

          {/* Images */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl overflow-hidden aspect-square flex items-center justify-center p-6 shadow-sm border border-gray-100">
              {product.images?.length > 0 ? (
                <img src={product.images[selectedImage]?.src} alt={product.title}
                  className="w-full h-full object-contain mix-blend-multiply" />
              ) : (
                <span className="text-8xl">👕</span>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-3 flex-wrap">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={'w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ' + (selectedImage === i ? 'border-coral scale-105' : 'border-gray-100 hover:border-coral/40')}>
                    <img src={img.src} alt={product.title + ' ' + (i+1)}
                      className="w-full h-full object-contain mix-blend-multiply p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-coral text-white text-xs px-3 py-1 rounded-full font-bold">{discountPct}% OFF</span>
              {product.product_type && <span className="bg-skyblue/30 text-charcoal text-xs px-3 py-1 rounded-full font-semibold">{product.product_type}</span>}
            </div>

            <h1 className="font-display text-3xl md:text-4xl text-charcoal leading-tight mb-3">{product.title}</h1>

            {/* Star rating */}
            {reviewData && (
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={reviewData.rating} />
                <span className="font-semibold text-sm text-charcoal">{reviewData.rating}.0</span>
                <span className="text-sm text-gray-400">({reviewData.reviews.length} review{reviewData.reviews.length > 1 ? 's' : ''})</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3 mb-4">
              <span className="font-display text-3xl text-coral">PKR {price.toLocaleString()}</span>
              <span className="font-display text-xl text-gray-400 line-through">PKR {fakeOriginal.toLocaleString()}</span>
              <span className="bg-coral/10 text-coral text-sm px-3 py-1 rounded-full font-bold">
                Save PKR {(fakeOriginal - price).toLocaleString()}
              </span>
            </div>

            {/* Low stock */}
            {lowStock && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 mb-4">
                <span className="text-orange-500 text-lg">🔥</span>
                <p className="text-orange-600 font-bold text-sm">Only {lowStock} left in stock — order soon!</p>
              </div>
            )}

            {/* Variants */}
            {hasVariants && (
              <div className="mb-6">
                <p className="font-semibold text-sm text-charcoal mb-3">
                  {product.options?.[0]?.name || 'Size'}:
                  <span className="text-coral ml-2">{selectedVariant?.title}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => (
                    <button key={v.id} onClick={() => setSelectedVariant(v)} disabled={!v.available}
                      className={'px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ' + (
                        selectedVariant?.id === v.id ? 'border-coral bg-coral text-white'
                        : !v.available ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                        : 'border-gray-200 text-charcoal hover:border-coral'
                      )}>
                      {v.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping info */}
            <div className="bg-cream rounded-2xl p-4 mb-6 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span>🚚</span>
                <span className="text-gray-600">Flat shipping <strong className="text-charcoal">PKR 250</strong> across Pakistan</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>💵</span>
                <span className="text-gray-600"><strong className="text-charcoal">Cash on Delivery</strong> available</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>📦</span>
                <span className="text-gray-600">Delivery in <strong className="text-charcoal">3-5 business days</strong></span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mb-4">
              <button onClick={handleAddToCart} disabled={isSoldOut || isMaxed}
                className={'flex-1 py-4 rounded-2xl font-display text-base border-2 transition-all ' + (
                  isSoldOut ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : isMaxed ? 'border-orange-200 text-orange-300 cursor-not-allowed'
                  : added ? 'border-mint bg-mint text-white'
                  : 'border-charcoal text-charcoal hover:bg-charcoal hover:text-white'
                )}>
                {isSoldOut ? 'Sold Out' : isMaxed ? 'Max Qty Reached' : added ? '✓ Added!' : '+ Add to Cart'}
              </button>
              <button onClick={() => !isSoldOut && setShowCheckout(true)} disabled={isSoldOut}
                className={'flex-1 py-4 rounded-2xl font-display text-base transition-all ' + (
                  isSoldOut ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-coral text-white hover:bg-opacity-90 hover:scale-[1.02]'
                )}>
                Buy Now
              </button>
            </div>

            <button onClick={() => setShowSizeChart(true)}
  className="text-center text-sm text-coral hover:underline mb-4 block w-full">
  📏 View Size Chart
</button>
<SizeRecommender />

            {/* Description */}
            {product.body_html && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-display text-xl text-charcoal mb-3">Product Details</h3>
                <div className="text-sm text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.body_html }} />
              </div>
            )}

            {/* Tags */}
            {productTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {productTags.slice(0, 6).map(tag => (
                  <span key={tag} className="bg-cream text-gray-500 text-xs px-3 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            )}

            {/* Reviews */}
            {reviewData && (
              <div className="border-t border-gray-100 mt-6 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <StarRating rating={reviewData.rating} />
                  <span className="font-display text-lg text-charcoal">{reviewData.rating}.0</span>
                  <span className="text-sm text-gray-400">({reviewData.reviews.length} review{reviewData.reviews.length > 1 ? 's' : ''})</span>
                </div>
                <div className="space-y-3">
                  {reviewData.reviews.map((r, i) => (
                    <div key={i} className="bg-cream rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-coral/20 rounded-full flex items-center justify-center font-display text-coral text-sm flex-shrink-0">
                          {r.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-charcoal">{r.name}</p>
                          <p className="text-xs text-gray-400">{r.city}</p>
                        </div>
                        <div className="ml-auto">
                          <StarRating rating={reviewData.rating} />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">"{r.review}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

<RecentlyViewed currentProductId={product.id} />
        {/* Related */}
        {related.length > 0 && (
          <section>
            <h2 className="section-title mb-8">You might also like 💛</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* Size Chart Popup */}
      {showSizeChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSizeChart(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
<h2 className="font-display text-2xl text-charcoal">📏 Size Chart</h2>
<button onClick={() => setShowSizeChart(false)}
  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-coral hover:text-white transition-colors flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              <p className="text-sm text-gray-500 mb-4">All measurements are in inches.</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-coral/10">
                    <th className="text-left font-display text-base text-charcoal p-3">Age</th>
                    <th className="text-left font-display text-base text-charcoal p-3">Shirt (in)</th>
                    <th className="text-left font-display text-base text-charcoal p-3">Bottom (in)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['0–3 Months','10','11'],['3–6 Months','11','11'],['6–9 Months','12','12'],
                    ['9–12 Months','13','14'],['12–18 Months (1 Year)','14','16'],
                    ['18–24 Months','15','17'],['2–3 Year','16','18'],['3–4 Year','17','20'],
                    ['4–5 Year','18','22'],['5–6 Year','19','24'],['6–7 Year','20','26'],
                    ['7–8 Year','21/22','28/30'],['9–10 Year','23/24','32'],
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-cream' : ''}>
                      <td className="p-3 font-display text-coral">{row[0]}</td>
                      <td className="p-3 font-semibold text-charcoal">{row[1]}</td>
                      <td className="p-3 font-semibold text-charcoal">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 bg-sunny/30 rounded-2xl p-4">
                <p className="text-xs text-gray-600">💡 <strong>Tip:</strong> Between sizes? Always size up for room to grow. Need help? <a href="https://wa.me/923360677340" target="_blank" rel="noopener noreferrer" className="text-coral font-semibold">WhatsApp us!</a></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCheckout && (
        <CheckoutModal product={product} variant={selectedVariant} onClose={() => setShowCheckout(false)} />
      )}
    </>
  )
}