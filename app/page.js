'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

const STORE_DOMAIN = 'the-kiddy-trends.myshopify.com'

const allCategories = [
  { id: 'all',         label: 'All Products',       emoji: '🛍️', color: 'bg-white',      desc: '' },
  { id: 'clothing',    label: 'Kids Clothing',       emoji: '👕', color: 'bg-coral/20',   desc: 'Newborn to 12 years' },
  { id: 'bedding',     label: 'Kids Bedding',        emoji: '🛏️', color: 'bg-skyblue/30', desc: 'Single bed sets & covers' },
  { id: 'bags',        label: 'Bags',                emoji: '🎒', color: 'bg-sunny/40',   desc: 'School, college & baby bags' },
  { id: 'accessories', label: 'Little Accessories',  emoji: '🎀', color: 'bg-mint/30',    desc: 'Pins, ponytails & more' },
]

export default function Collections() {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeCat, setActiveCat] = useState('all')
  const [sort, setSort]           = useState('default')

  useEffect(() => {
    fetch(`https://${STORE_DOMAIN}/products.json?limit=100`)
      .then(r => r.json())
      .then(data => { setProducts(data.products || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  let filtered = products.filter(p => {
    if (activeCat === 'all') return true
    const type  = (p.product_type || '').toLowerCase()
    const tags  = (p.tags || []).map(t => t.toLowerCase()).join(' ')
    const title = (p.title || '').toLowerCase()
    if (activeCat === 'clothing')    return type.includes('cloth') || type.includes('shirt') || type.includes('dress') || type.includes('suit') || type.includes('frock') || type.includes('track') || tags.includes('cloth') || tags.includes('shirt')
    if (activeCat === 'bedding')     return type.includes('bed') || type.includes('sheet') || type.includes('pillow') || tags.includes('bed') || title.includes('bed')
    if (activeCat === 'bags')        return type.includes('bag') || type.includes('backpack') || tags.includes('bag') || title.includes('bag')
    if (activeCat === 'accessories') return type.includes('access') || type.includes('hair') || tags.includes('hair') || title.includes('pin') || title.includes('hair')
    return true
  })

  if (sort === 'low')  filtered = [...filtered].sort((a,b) => parseFloat(a.variants[0]?.price) - parseFloat(b.variants[0]?.price))
  if (sort === 'high') filtered = [...filtered].sort((a,b) => parseFloat(b.variants[0]?.price) - parseFloat(a.variants[0]?.price))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="section-title mb-3">Our Collections 🛍️</h1>
        <p className="text-gray-500 text-lg">Everything your little one needs</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {allCategories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCat(cat.id)}
            className={`${cat.color} rounded-3xl p-5 text-center transition-all hover:scale-105 border-2 ${activeCat === cat.id ? 'border-coral shadow-md' : 'border-transparent'}`}>
            <div className="text-4xl mb-2">{cat.emoji}</div>
            <h3 className="font-display text-base text-charcoal">{cat.label}</h3>
            {cat.desc && <p className="text-xs text-gray-500 mt-1">{cat.desc}</p>}
          </button>
        ))}
      </div>

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

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="font-display text-2xl text-gray-400">No products found in this category</h3>
          <button onClick={() => setActiveCat('all')} className="btn-primary mt-5">View All Products</button>
        </div>
      )}

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
                  {isOnSale && (
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