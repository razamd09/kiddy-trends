'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

const STORE_DOMAIN = 'the-kiddy-trends.myshopify.com'

const allCategories = [
  { id: 'all',         label: 'All Products',       emoji: '🛍️', color: 'bg-white',      desc: '' },
  { id: 'newborn',     label: 'Newborn',             emoji: '👶', color: 'bg-skyblue/30', desc: '0–12 months' },
  { id: 'toddler',     label: 'Toddler',             emoji: '🧸', color: 'bg-sunny/40',   desc: '1–3 years' },
  { id: 'kids',        label: 'Kids',                emoji: '🎒', color: 'bg-mint/30',    desc: '4–8 years' },
  { id: 'tweens',      label: 'Tweens',              emoji: '⭐', color: 'bg-coral/20',   desc: '9–12 years' },
  { id: 'bedding',     label: 'Kids Bedding',        emoji: '🛏️', color: 'bg-skyblue/20', desc: 'Bed sets & covers' },
  { id: 'bags',        label: 'Bags',                emoji: '🎒', color: 'bg-sunny/30',   desc: 'School & baby bags' },
  { id: 'accessories', label: 'Accessories',         emoji: '🎀', color: 'bg-mint/20',    desc: 'Pins, ponytails & more' },
]

// Age keyword maps
const newbornKeywords  = ['0-3','0-6','3-6','6-9','9-12','newborn','infant','baby','0 month','1 month','2 month','3 month','4 month','5 month','6 month','7 month','8 month','9 month','10 month','11 month','12 month']
const toddlerKeywords  = ['1 year','2 year','3 year','1-2','2-3','1yr','2yr','3yr','12-18','18-24','toddler','1y','2y','3y']
const kidsKeywords     = ['4 year','5 year','6 year','7 year','8 year','4-5','5-6','6-7','7-8','4yr','5yr','6yr','7yr','8yr','4y','5y','6y','7y','8y']
const tweensKeywords   = ['9 year','10 year','11 year','12 year','9-10','10-11','11-12','9yr','10yr','11yr','12yr','9y','10y','11y','12y','tween']

function matchesAge(product, keywords) {
  const searchText = [
    product.title,
    product.product_type,
    ...(product.tags || []),
    ...(product.variants || []).map(v => v.title + ' ' + (v.option1 || '') + ' ' + (v.option2 || '') + ' ' + (v.option3 || '')),
    ...(product.options || []).flatMap(o => o.values || [])
  ].join(' ').toLowerCase()

  return keywords.some(k => searchText.includes(k.toLowerCase()))
}

function matchesCategory(product, cat) {
  const type  = (product.product_type || '').toLowerCase()
  const tags  = (product.tags || []).map(t => t.toLowerCase()).join(' ')
  const title = (product.title || '').toLowerCase()

  if (cat === 'newborn')     return matchesAge(product, newbornKeywords)
  if (cat === 'toddler')     return matchesAge(product, toddlerKeywords)
  if (cat === 'kids')        return matchesAge(product, kidsKeywords)
  if (cat === 'tweens')      return matchesAge(product, tweensKeywords)
  if (cat === 'bedding')     return type.includes('bed') || type.includes('sheet') || type.includes('pillow') || type.includes('duvet') || tags.includes('bed') || title.includes('bed') || title.includes('sheet') || title.includes('pillow')
  if (cat === 'bags')        return type.includes('bag') || type.includes('backpack') || tags.includes('bag') || title.includes('bag') || title.includes('backpack')
  if (cat === 'accessories') return type.includes('access') || type.includes('hair') || type.includes('pin') || tags.includes('hair') || tags.includes('pin') || title.includes('pin') || title.includes('hair') || title.includes('ponytail') || title.includes('scrunchie') || title.includes('clip') || title.includes('headband')
  return true
}

export default function Collections() {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeCat, setActiveCat] = useState('all')
  const [sort, setSort]           = useState('default')

  useEffect(() => {
    async function fetchAll() {
      try {
        const [p1, p2] = await Promise.all([
          fetch(`https://${STORE_DOMAIN}/products.json?limit=250&page=1`).then(r => r.json()),
          fetch(`https://${STORE_DOMAIN}/products.json?limit=250&page=2`).then(r => r.json()),
        ])
        setProducts([...(p1.products || []), ...(p2.products || [])])
        setLoading(false)
      } catch { setLoading(false) }
    }
    fetchAll()
  }, [])

  let filtered = activeCat === 'all'
    ? products
    : products.filter(p => matchesCategory(p, activeCat))

  if (sort === 'low')  filtered = [...filtered].sort((a,b) => parseFloat(a.variants[0]?.price) - parseFloat(b.variants[0]?.price))
  if (sort === 'high') filtered = [...filtered].sort((a,b) => parseFloat(b.variants[0]?.price) - parseFloat(a.variants[0]?.price))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="section-title mb-3">Our Collections 🛍️</h1>
        <p className="text-gray-500 text-lg">Everything your little one needs — all in one place</p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-3 mb-10 justify-center">
        {allCategories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCat(cat.id)}
            className={`${cat.color} rounded-full px-5 py-2.5 text-center transition-all hover:scale-105 border-2 flex items-center gap-2 ${activeCat === cat.id ? 'border-coral shadow-md scale-105' : 'border-transparent'}`}>
            <span>{cat.emoji}</span>
            <div className="text-left">
              <p className="font-display text-sm text-charcoal leading-tight">{cat.label}</p>
              {cat.desc && <p className="text-xs text-gray-400 leading-tight">{cat.desc}</p>}
            </div>
          </button>
        ))}
      </div>

      {/* Sort + count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400 font-semibold">
          {loading ? 'Loading products...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
        </p>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-4 py-2 rounded-full border-2 border-gray-100 text-sm font-semibold focus:outline-none focus:border-coral bg-cream">
          <option value="default">Sort: Default</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-3xl overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded-xl mt-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="font-display text-2xl text-gray-400">No products found in this category</h3>
          <p className="text-gray-400 mt-2 mb-6">Try a different category or view all products</p>
          <button onClick={() => setActiveCat('all')} className="btn-primary">View All Products</button>
        </div>
      )}

      {/* Product grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map(product => {
            const price        = product.variants?.[0]?.price
            const comparePrice = product.variants?.[0]?.compare_at_price
            const image        = product.images?.[0]?.src
            const isOnSale     = comparePrice && parseFloat(comparePrice) > parseFloat(price)
            const isSoldOut    = !product.variants?.some(v => v.available)
            return (
              <div key={product.id} className="bg-white rounded-3xl overflow-hidden card-hover shadow-sm border border-gray-100">
                <div className="relative h-48 bg-cream">
                  {image ? (
                    <Image src={image} alt={product.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">👕</div>
                  )}
                  {isOnSale && !isSoldOut && (
                    <span className="absolute top-2 left-2 bg-coral text-white text-xs px-2 py-1 rounded-full font-bold">SALE</span>
                  )}
                  {isSoldOut && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-charcoal font-display text-sm px-3 py-1 rounded-full">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-display text-sm text-charcoal leading-tight line-clamp-2">{product.title}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-coral font-bold text-sm">PKR {parseFloat(price).toLocaleString()}</p>
                    {isOnSale && <p className="text-gray-400 text-xs line-through">PKR {parseFloat(comparePrice).toLocaleString()}</p>}
                  </div>
                  <a href={`https://the-kiddy-trends.myshopify.com/products/${product.handle}`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-3 w-full bg-charcoal text-white text-sm font-semibold py-2 rounded-xl hover:bg-coral transition-colors block text-center">
                    {isSoldOut ? 'View Product' : 'Buy Now'}
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}