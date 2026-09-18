'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from '../../components/ProductCard'

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
      { id: '1-2y',   label: '1–2 Year',    keywords: ['12-18','18-24','12 to 18','18 to 24','1 year','2 year','1yr','2yr'] },
      { id: '12-18m', label: '12–18 Months', keywords: ['12-18','12 to 18','12/18'] },
      { id: '18-24m', label: '18–24 Months', keywords: ['18-24','18 to 24','18/24'] },
      { id: '2-3y',   label: '2–3 Year',     keywords: ['2-3','2-3 year','2 to 3','2/3 year','2yr','3yr'] },
    ]
  },
  {
    id: 'kids', label: 'Kids', emoji: '🎒', color: 'bg-mint/30',
    subFilters: [
      { id: '3-4y', label: '3–4 Year', keywords: ['3-4','3-4 year','3 to 4','3/4 year','3yr','4yr'] },
      { id: '4-5y', label: '4–5 Year', keywords: ['4-5','4-5 year','4 to 5','4/5 year','4yr','5yr'] },
      { id: '5-6y', label: '5–6 Year', keywords: ['5-6','5-6 year','5 to 6','5/6 year','5yr','6yr'] },
      { id: '6-7y', label: '6–7 Year', keywords: ['6-7','6-7 year','6 to 7','6/7 year','6yr','7yr'] },
      { id: '7-8y', label: '7–8 Year', keywords: ['7-8','7-8 year','7 to 8','7/8 year','7yr','8yr'] },
    ]
  },
  {
    id: 'tweens', label: 'Tweens', emoji: '⭐', color: 'bg-coral/20',
    subFilters: [
      { id: '9-10y',  label: '9–10 Year',  keywords: ['9-10','9-10 year','9 to 10','9yr','10yr'] },
      { id: '10-11y', label: '10–11 Year', keywords: ['10-11','10-11 year','10 to 11','10yr','11yr'] },
      { id: '11-12y', label: '11–12 Year', keywords: ['11-12','11-12 year','11 to 12','11yr','12yr'] },
      { id: '12-13y', label: '12–13 Year', keywords: ['12-13','12-13 year','12 to 13','12yr','13yr'] },
    ]
  },
  { id: 'bedding',     label: 'Bedding',     emoji: '🛏️', color: 'bg-skyblue/20', subFilters: [] },
  { id: 'bags',        label: 'Bags',        emoji: '🎒', color: 'bg-sunny/30',   subFilters: [] },
  { id: 'accessories', label: 'Accessories', emoji: '🎀', color: 'bg-mint/20',    subFilters: [] },
]

// Every age-bracket id maps to its match keywords / display label, regardless
// of which broad category it lives under — built once at module load.
const AGE_KEYWORDS_BY_ID = {}
const AGE_LABEL_BY_ID = {}
categories.forEach((cat) => {
  ;(cat.subFilters || []).forEach((sub) => {
    AGE_KEYWORDS_BY_ID[sub.id] = sub.keywords || []
    AGE_LABEL_BY_ID[sub.id] = sub.label
  })
})

function getProductText(product) {
  return [
    product.title,
    product.product_type,
    ...(product.tags || []),
    ...(product.variants || []).map(v =>
      [v.title, v.option1, v.option2, v.option3].filter(Boolean).join(' ')
    ),
    ...(product.options || []).flatMap(o => o.values || [])
  ].join(' ').toLowerCase()
}

// Broad category browsing when no specific age bracket is selected (e.g. the
// "Kids" pill on its own, or Bedding/Bags/Accessories which have no ages at all).
function matchesCategoryBucket(product, catId) {
  const text = getProductText(product)
  const type = (product.product_type || '').toLowerCase()
  const title = (product.title || '').toLowerCase()
  const category = (product.category || '').toLowerCase()

  const newbornKw  = ['0-3','0 to 3','0/3','0-3m','3-6','3 to 6','3/6','3-6m','6-9','6 to 9','6/9','6-9m','9-12','9 to 12','9/12','9-12m','newborn','new born','infant','0 month','1 month','2 month','3 month','4 month','5 month','6 month','7 month','8 month','9 month','10 month','11 month']
  const toddlerKw  = ['12-18','12 to 18','12/18','18-24','18 to 24','18/24','1-2 year','1 to 2 year','1 year','2 year','3 year','toddler','1yr','2yr','3yr']
  const kidsKw     = ['4 year','5 year','6 year','7 year','8 year','4yr','5yr','6yr','7yr','8yr','4-5','5-6','6-7','7-8','3-4']
  const tweensKw   = ['9 year','10 year','11 year','12 year','13 year','9yr','10yr','11yr','12yr','13yr','tween','9-10','11-12','12-13']
  const beddingKw  = ['bedding', 'bedsheet', 'bed sheet', 'duvet', 'razai', 'comforter', 'pillow', 'fitted sheet']

  if (catId === 'newborn')     return newbornKw.some(k => text.includes(k)) || category.includes('newborn') || category.includes('infant') || type.includes('newborn') || type.includes('infant')
  if (catId === 'toddler')     return toddlerKw.some(k => text.includes(k))
  if (catId === 'kids')        return kidsKw.some(k => text.includes(k))
  if (catId === 'tweens')      return tweensKw.some(k => text.includes(k))
  if (catId === 'bedding')     return beddingKw.some((k) => text.includes(k) || type.includes(k) || category.includes(k))
  if (catId === 'bags')        return category.includes('bag') || type.includes('bag') || type.includes('backpack') || title.includes('bag') || title.includes('backpack')
  if (catId === 'accessories') return category.includes('access') || type.includes('access') || type.includes('hair') || title.includes('pin') || title.includes('hair') || title.includes('ponytail') || title.includes('scrunchie') || title.includes('clip') || title.includes('headband')
  return true
}

function matchesGenderId(product, genderId) {
  const title = (product.title || '').toLowerCase()
  if (genderId === 'boys') return /\bboys?\b/.test(title)
  if (genderId === 'girls') return /\bgirls?\b/.test(title)
  return true
}

// Empty selection or both genders selected = no restriction.
function matchesAnyGenders(product, genderIds) {
  if (!Array.isArray(genderIds) || genderIds.length === 0 || genderIds.length >= 2) return true
  return matchesGenderId(product, genderIds[0])
}

function matchesAnyAges(product, ageIds) {
  if (!Array.isArray(ageIds) || ageIds.length === 0) return true
  const text = getProductText(product)
  return ageIds.some((ageId) =>
    (AGE_KEYWORDS_BY_ID[ageId] || []).some((kw) => text.includes(String(kw).toLowerCase()))
  )
}

function productTypeMatches(productType, queryProductType) {
  const productValue = String(productType || '').trim().toLowerCase()
  const queryValue = String(queryProductType || '').trim().toLowerCase()

  if (productValue === queryValue) return true

  const mockNeckValues = new Set(['mock neck', 'mock necks'])
  return mockNeckValues.has(productValue) && mockNeckValues.has(queryValue)
}

function getProductSeason(product) {
  return String(product?.product_season || '').trim()
}

function normalizeSeasonQuery(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z_]/g, '')
  if (normalized === 'winter') return 'Winter'
  if (normalized === 'summer') return 'Summer'
  if (normalized === 'mid_weather' || normalized === 'midweather') return 'Mid_Weather'
  return null
}

function getCreatedAtValue(product) {
  const value = new Date(product?.created_at || 0).getTime()
  return Number.isFinite(value) ? value : 0
}

// Cache products in module scope so they persist between renders
let cachedProducts = []
let cacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function CollectionsClient({ initialProducts = [] }) {
  const searchParams = useSearchParams()
  const [products, setProducts]   = useState(cachedProducts.length > 0 ? cachedProducts : initialProducts)
  const [loading, setLoading]     = useState(cachedProducts.length === 0 && initialProducts.length === 0)
  const [activeCat, setActiveCat] = useState('all')
  const [activeGender, setActiveGender] = useState(null)
  const [activeSub, setActiveSub] = useState(null)
  const [queryGenders, setQueryGenders] = useState([])
  const [queryAges, setQueryAges] = useState([])
  const [queryTitle, setQueryTitle] = useState('')
  const [queryProductType, setQueryProductType] = useState('')
  const [querySeason, setQuerySeason] = useState(null)
  const [queryCharacter, setQueryCharacter] = useState('')
  const [queryBrand, setQueryBrand] = useState('')
  const [page, setPage]           = useState(1)
  const ITEMS_PER_PAGE = 40

  useEffect(() => {
    const queryCat = searchParams.get('cat')
    const querySub = searchParams.get('sub')
    const queryGender = searchParams.get('gender')
    const queryAges = (searchParams.get('ages') || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
    const queryGenders = (searchParams.get('genders') || '')
      .split(',')
      .map((x) => x.trim().toLowerCase())
      .filter((x) => x === 'boys' || x === 'girls')
    const queryTitle = (searchParams.get('title') || '').trim().toLowerCase()
    const queryProductType = (searchParams.get('product_type') || '').trim().toLowerCase()
    const querySeason = normalizeSeasonQuery(searchParams.get('season'))
    const queryCharacter = (searchParams.get('character') || '').trim().toLowerCase()
    const queryBrand = (searchParams.get('brand') || '').trim().toLowerCase()

    const validCat = categories.some((c) => c.id === queryCat) ? queryCat : null
    const catId = validCat || 'all'
    const activeCategory = categories.find((c) => c.id === catId)

    const validGender = queryGender === 'boys' || queryGender === 'girls' ? queryGender : null
    const validSub = activeCategory?.subFilters?.some((s) => s.id === querySub) ? querySub : null

    if (queryCat || querySub || queryGender) {
      setActiveCat(catId)
      setActiveGender(validGender)
      setActiveSub(validSub)
      setPage(1)
    } else {
      setActiveCat('all')
      setActiveGender(null)
      setActiveSub(null)
      setPage(1)
    }

    setQueryAges(queryAges)
    setQueryGenders(queryGenders)
    setQueryTitle(queryTitle)
    setQueryProductType(queryProductType)
    setQuerySeason(querySeason)
    setQueryCharacter(queryCharacter)
    setQueryBrand(queryBrand)
  }, [searchParams])

  useEffect(() => {
    // Use cache if fresh
    if (cachedProducts.length > 0 && Date.now() - cacheTime < CACHE_DURATION) {
      setProducts(cachedProducts)
      setLoading(false)
      return
    }
    async function fetchAll() {
      try {
        const first = await fetch('/api/products?limit=400&page=1', {
          cache: 'force-cache'
        }).then(r => r.json())

        const totalPages = Math.max(first.pages || 1, 1)
        const restPagePromises = []
        for (let p = 2; p <= totalPages; p++) {
          restPagePromises.push(
            fetch('/api/products?limit=400&page=' + p, {
              cache: 'force-cache'
            }).then(r => r.json())
          )
        }

        const restPages = restPagePromises.length > 0 ? await Promise.all(restPagePromises) : []
        const all = [
          ...(first.products || []),
          ...restPages.flatMap((pageResult) => pageResult.products || [])
        ]
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
  const showGenderFilter = ['kids', 'toddler', 'tweens'].includes(activeCat)

  // On-page pills (single-select) take priority; otherwise fall back to
  // whatever gender/size the customer already picked in the homepage popup.
  const effectiveGenders = activeGender ? [activeGender] : queryGenders
  const effectiveAgeIds  = activeSub ? [activeSub] : queryAges

  let filtered = products

  if (effectiveAgeIds.length > 0) {
    filtered = filtered.filter((p) => matchesAnyAges(p, effectiveAgeIds))
  } else if (activeCat !== 'all') {
    filtered = filtered.filter((p) => matchesCategoryBucket(p, activeCat))
  }

  if (effectiveGenders.length > 0) {
    filtered = filtered.filter((p) => matchesAnyGenders(p, effectiveGenders))
  }

  if (queryTitle) {
    filtered = filtered.filter((p) => String(p?.title || '').toLowerCase().includes(queryTitle))
  }

  if (queryProductType) {
    filtered = filtered.filter((p) => productTypeMatches(p?.product_type, queryProductType))
  }

  if (querySeason) {
    filtered = filtered.filter((p) => getProductSeason(p) === querySeason)
  }

  if (queryCharacter) {
    filtered = filtered.filter((p) => String(p?.character || '').toLowerCase() === queryCharacter)
  }

  if (queryBrand) {
    filtered = filtered.filter((p) => String(p?.brand || '').toLowerCase() === queryBrand)
  }

  filtered = [...filtered].sort((a, b) => getCreatedAtValue(b) - getCreatedAtValue(a))

  // Pagination
  const totalPages   = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated    = filtered.slice(0, page * ITEMS_PER_PAGE)
  const hasMore      = page < totalPages

  function handleCatClick(catId) {
    setActiveCat(catId)
    setActiveGender(null)
    setActiveSub(null)
    setPage(1)
  }

  function resetAllFilters() {
    setActiveCat('all')
    setActiveGender(null)
    setActiveSub(null)
    setQueryAges([])
    setQueryGenders([])
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
            {showGenderFilter && (
              <>
                <p className="w-full text-center font-display text-charcoal text-sm mb-1">Select Boys / Girls:</p>
                <button onClick={() => { setActiveGender(null); setPage(1) }}
                  className={'px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ' + (!activeGender ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-gray-200 hover:border-charcoal')}>
                  All
                </button>
                <button onClick={() => { setActiveGender('boys'); setPage(1) }}
                  className={'px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ' + (activeGender === 'boys' ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-gray-200 hover:border-charcoal')}>
                  Boys
                </button>
                <button onClick={() => { setActiveGender('girls'); setPage(1) }}
                  className={'px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ' + (activeGender === 'girls' ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-gray-200 hover:border-charcoal')}>
                  Girls
                </button>
                <div className="w-full h-px bg-charcoal/10 my-1" />
              </>
            )}
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

      {/* Count */}
      <div className="mb-6">
        <p className="text-sm text-gray-400 font-semibold">
          {loading ? 'Loading...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
          {effectiveGenders.length === 1 && (
            <span className="ml-2 text-coral">· {effectiveGenders[0] === 'boys' ? 'Boys' : 'Girls'}</span>
          )}
          {effectiveAgeIds.length > 0 && (
            <span className="ml-2 text-coral">· {effectiveAgeIds.map((id) => AGE_LABEL_BY_ID[id]).filter(Boolean).join(', ')}</span>
          )}
        </p>
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
          <button onClick={resetAllFilters} className="btn-primary">
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
