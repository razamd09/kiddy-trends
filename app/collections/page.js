'use client'
import { useState, useEffect } from 'react'
import ProductCard from '../../components/ProductCard'

const STORE_DOMAIN = 'the-kiddy-trends.myshopify.com'

const categories = [
  {
    id: 'newborn', label: 'Newborn', emoji: '👶', color: 'bg-skyblue/30',
    subFilters: [
      { id: '0-3m',  label: '0–3 Months',  keywords: ['0-3','0 to 3','0/3'] },
      { id: '3-6m',  label: '3–6 Months',  keywords: ['3-6','3 to 6','3/6'] },
      { id: '6-9m',  label: '6–9 Months',  keywords: ['6-9','6 to 9','6/9'] },
      { id: '9-12m', label: '9–12 Months', keywords: ['9-12','9 to 12','9/12'] },
    ]
  },
  {
    id: 'toddler', label: 'Toddler', emoji: '🧸', color: 'bg-sunny/40',
    subFilters: [
      { id: '12-18m', label: '12–18 Months', keywords: ['12-18','12 to 18','12/18'] },
      { id: '18-24m', label: '18–24 Months', keywords: ['18-24','18 to 24','18/24'] },
      { id: '2-3y',   label: '2–3 Year',     keywords: ['2-3 year','2 to 3','2/3 year','2yr','3yr'] },
    ]
  },
  {
    id: 'kids', label: 'Kids', emoji: '🎒', color: 'bg-mint/30',
    subFilters: [
      { id: '3-4y', label: '3–4 Year', keywords: ['3-4 year','3 to 4','3/4 year','3yr','4yr'] },
      { id: '4-5y', label: '4–5 Year', keywords: ['4-5 year','4 to 5','4/5 year','4yr','5yr'] },
      { id: '5-6y', label: '5–6 Year', keywords: ['5-6 year','5 to 6','5/6 year','5yr','6yr'] },
      { id: '6-7y', label: '6–7 Year', keywords: ['6-7 year','6 to 7','6/7 year','6yr','7yr'] },
      { id: '7-8y', label: '7–8 Year', keywords: ['7-8 year','7 to 8','7/8 year','7yr','8yr'] },
    ]
  },
  {
    id: 'tweens', label: 'Tweens', emoji: '⭐', color: 'bg-coral/20',
    subFilters: [
      { id: '9-10y',  label: '9–10 Year',  keywords: ['9-10 year','9 to 10','9yr','10yr'] },
      { id: '11-12y', label: '11–12 Year', keywords: ['11-12 year','11 to 12','11yr','12yr'] },
    ]
  },
  { id: 'bedding',     label: 'Bedding',     emoji: '🛏️', color: 'bg-skyblue/20', subFilters: [] },
  { id: 'bags',        label: 'Bags',        emoji: '🎒', color: 'bg-sunny/30',   subFilters: [] },
  { id: 'accessories', label: 'Accessories', emoji: '🎀', color: 'bg-mint/20',    subFilters: [] },
]

function productMatchesFilter(product, catId, subId, subFilters) {
  const text = [
    product.title,
    product.product_type,
    ...(product.tags || []),
    ...(product.variants || []).map(v =>
      [v.title, v.option1, v.option2, v.option3].filter(Boolean).join(' ')
    ),
    ...(product.options || []).flatMap(o => o.values || [])
  ].join(' ').toLowerCase()

  const type  = (product.product_type || '').toLowerCase()
  const title = (product.title || '').toLowerCase()

  if (subId) {
    const sub = subFilters.find(s => s.id === subId)
    if (!sub) return false
    return sub.keywords.some(k => text.includes(k.toLowerCase()))
  }

  const newbornKw  = ['0-3','3-6','6-9','9-12','newborn','infant','0 month','1 month','2 month','3 month','4 month','5 month','6 month','7 month','8 month','9 month','10 month','11 month','12 month']
  const toddlerKw  = ['12-18','18-24','1 year','2 year','3 year','toddler','1yr','2yr','3yr']
  const kidsKw     = ['4 year','5 year','6 year','7 year','8 year','4yr','5yr','6yr','7yr','8yr','4-5','5-6','6-7','7-8','3-4']
  const tweensKw   = ['9 year','10 year','11 year','12 year','9yr','10yr','11yr','12yr','tween','9-10','11-12']

  if (catId === 'newborn')     return newbornKw.some(k => text.includes(k))
  if (catId === 'toddler')     return toddlerKw.some(k => text.includes(k))
  if (catId === 'kids')        return kidsKw.some(k => text.includes(k))
  if (catId === 'tweens')      return tweensKw.some(k => text.includes(k))
  if (catId === 'bedding')     return type.includes('bed') || type.includes('sheet') || type.includes('pillow') || title.includes('bed') || title.includes('sheet')
  if (catId === 'bags')        return type.includes('bag') || type.includes('backpack') || title.includes('bag') || title.includes('backpack')
  if (catId === 'accessories') return type.includes('access') || type.includes('hair') || title.includes('pin') || title.includes('hair') || title.includes('ponytail') || title.includes('scrunchie') || title.includes('clip') || title.includes('headband')
  return true
}

// Cache products in module scope so they persist between renders
let cachedProducts = []
let cacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function Collections() {
  const [products, setProducts]   = useState(cachedProducts)
  const [loading, setLoading]     = useState(cachedProducts.length === 0)
  const [activeCat, setActiveCat] = useState('all')
  const [activeSub, setActiveSub] = useState(null)
  const [sort, setSort]           = useState('default')
  const [page, setPage]           = useState(1)
  const ITEMS_PER_PAGE = 40

  useEffect(() => {
    // Use cache if fresh
    if (cachedProducts.length > 0 && Date.now() - cacheTime < CACHE_DURATION) {
      setProducts(cachedProducts)
      setLoading(false)
      return
    }
    async function fetchAll() {
      try {
        const [p1, p2] = await Promise.all([
          fetch('https://' + STORE_DOMAIN + '/products.json?limit=250&page=1').then(r => r.json()),
          fetch('https://' + STORE_DOMAIN + '/products.json?limit=250&page=2').then(r => r.json()),
        ])
        const all = [...(p1.products || []), ...(p2.products || [])]
        cachedProducts = all
        cacheTime = Date.now()
        setProducts(all)
        setLoading(false)
      } catch { setLoading(false) }
    }
    fetchAll()
  }, [])

  const activeCatObj = categories.find(c => c.id === activeCat)
  const subFilters   = activeCatObj?.subFilters || []

  let filtered = activeCat === 'all'
    ? products
    : products.filter(p => productMatchesFilter(p, activeCat, activeSub, subFilters))

  if (sort === 'low')          filtered = [...filtered].sort((a,b) => parseFloat(a.variants[0]?.price) - parseFloat(b.variants[0]?.price))
  if (sort === 'high')         filtered = [...filtered].sort((a,b) => parseFloat(b.variants[0]?.price) - parseFloat(a.variants[0]?.price))
  if (sort === 'az')           filtered = [...filtered].sort((a,b) => a.title.localeCompare(b.title))
  if (sort === 'za')           filtered = [...filtered].sort((a,b) => b.title.localeCompare(a.title))
  if (sort === 'old')          filtered = [...filtered].sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
  if (sort === 'new')          filtered = [...filtered].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
  if (sort === 'best_selling') filtered = [...filtered].sort((a,b) => (b.variants?.[0]?.inventory_quantity || 0) - (a.variants?.[0]?.inventory_quantity || 0))
  // Priority sorting: "Summer New Arrival 2026" first, then other 2026, then rest
  filtered = [...filtered].sort((a, b) => {
    const aTitle = (a.title || '').toLowerCase()
    const bTitle = (b.title || '').toLowerCase()
    const aPriority = aTitle.includes('summer new arrival 2026') ? 2 : aTitle.includes('2026') ? 1 : 0
    const bPriority = bTitle.includes('summer new arrival 2026') ? 2 : bTitle.includes('2026') ? 1 : 0
    return bPriority - aPriority
  })

  // Pagination
  const totalPages   = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated    = filtered.slice(0, page * ITEMS_PER_PAGE)
  const hasMore      = page < totalPages

  function handleCatClick(catId) {
    setActiveCat(catId)
    setActiveSub(null)
    setPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="section-title mb-3">Our Collections 🛍️</h1>
        <p className="text-gray-500 text-lg">Everything your little one needs</p>
      </div>

      {/* Main category pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <button onClick={() => handleCatClick('all')}
          className={'flex items-center gap-2 px-5 py-2.5 rounded-full font-display text-sm transition-all border-2 ' + (activeCat === 'all' ? 'bg-coral text-white border-coral shadow-md' : 'bg-white text-charcoal border-gray-100 hover:border-coral/40')}>
          🛍️ All Products
        </button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => handleCatClick(cat.id)}
            className={'flex items-center gap-2 px-5 py-2.5 rounded-full font-display text-sm transition-all border-2 ' + (activeCat === cat.id ? 'bg-coral text-white border-coral shadow-md' : 'bg-white text-charcoal border-gray-100 hover:border-coral/40')}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Sub-filters */}
      {subFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <div className={'w-full flex flex-wrap gap-2 justify-center p-4 rounded-2xl ' + activeCatObj?.color}>
            <p className="w-full text-center font-display text-charcoal text-sm mb-1">Select age group:</p>
            <button onClick={() => setActiveSub(null)}
              className={'px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ' + (!activeSub ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-gray-200 hover:border-charcoal')}>
              All Ages
            </button>
            {subFilters.map(sub => (
              <button key={sub.id} onClick={() => setActiveSub(sub.id)}
                className={'px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ' + (activeSub === sub.id ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-gray-200 hover:border-charcoal')}>
                {sub.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort + count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400 font-semibold">
          {loading ? 'Loading...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
          {activeSub && <span className="ml-2 text-coral">· {subFilters.find(s => s.id === activeSub)?.label}</span>}
        </p>
        <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}
          className="px-4 py-2 rounded-full border-2 border-gray-100 text-sm font-semibold focus:outline-none focus:border-coral bg-cream">
          <option value="default">Featured</option>
          <option value="best_selling">Best Selling</option>
          <option value="az">A–Z</option>
          <option value="za">Z–A</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
          <option value="new">Newest First</option>
          <option value="old">Oldest First</option>
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

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="font-display text-2xl text-gray-400">No products found</h3>
          <p className="text-gray-400 mt-2 mb-6">Try a different age group or category</p>
          <button onClick={() => { setActiveCat('all'); setActiveSub(null) }} className="btn-primary">
            View All Products
          </button>
        </div>
      )}

      {/* Product grid */}
      {!loading && paginated.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {paginated.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Load more button */}
          {hasMore && (
            <div className="text-center mt-10">
              <button onClick={() => setPage(p => p + 1)}
                className="bg-coral text-white font-display text-base px-10 py-3 rounded-full hover:bg-opacity-90 transition-all hover:scale-105 shadow-md">
                Load More Products ({filtered.length - paginated.length} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}