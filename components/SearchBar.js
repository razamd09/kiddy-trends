'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchBar() {
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [open, setOpen]             = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const ref    = useRef(null)
  const router = useRouter()

  const STORE_DOMAIN = 'the-kiddy-trends.myshopify.com'

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch('https://' + STORE_DOMAIN + '/products.json?limit=250')
        const data = await res.json()
        const q    = query.toLowerCase()
        const filtered = (data.products || [])
          .filter(p =>
            p.title.toLowerCase().includes(q) ||
            (p.product_type || '').toLowerCase().includes(q) ||
            (p.tags || []).join(' ').toLowerCase().includes(q)
          )
          .slice(0, 8)
        setResults(filtered)
        setOpen(true)
      } catch {}
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div ref={ref} className="relative">

      {/* Search toggle button */}
      {!showSearch && (
        <button onClick={() => setShowSearch(true)}
          className="p-2 rounded-full hover:bg-coral/10 transition-colors">
          <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      )}

      {/* Search input */}
      {showSearch && (
        <div className="flex items-center gap-2 bg-cream border-2 border-coral/30 rounded-full px-4 py-2 w-64 focus-within:border-coral transition-colors">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input autoFocus type="text" value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products..."
            className="bg-transparent text-sm focus:outline-none w-full text-charcoal" />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
              className="text-gray-400 hover:text-coral text-xs">✕</button>
          )}
        </div>
      )}

      {/* Results */}
      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="p-3">
            <p className="text-xs text-gray-400 font-semibold px-2 mb-2">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
            <div className="space-y-1">
              {results.map(product => {
                const price = parseFloat(product.variants?.[0]?.price || 0)
                const image = product.images?.[0]?.src
                return (
                  <a key={product.id}
                    href={'https://the-kiddy-trends.myshopify.com/products/' + product.handle}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => { setOpen(false); setShowSearch(false); setQuery('') }}
                    className="flex items-center gap-3 p-2 rounded-2xl hover:bg-cream transition-colors">
                    <div className="w-12 h-12 bg-cream rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {image
                        ? <img src={image} alt={product.title} className="w-full h-full object-contain mix-blend-multiply p-1" />
                        : <span className="text-xl">👕</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-charcoal leading-tight line-clamp-2">{product.title}</p>
                      <p className="text-coral font-bold text-xs mt-0.5">PKR {price.toLocaleString()}</p>
                    </div>
                  </a>
                )
              })}
            </div>
            <button onClick={() => { router.push('/collections'); setOpen(false); setShowSearch(false); setQuery('') }}
              className="w-full text-center text-xs text-coral font-semibold py-2 mt-2 hover:bg-coral/10 rounded-xl transition-colors">
              View all results in Collections →
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {open && query && results.length === 0 && !loading && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-white rounded-3xl shadow-xl border border-gray-100 z-50 p-5 text-center">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm font-semibold text-charcoal">No results for "{query}"</p>
          <p className="text-xs text-gray-400 mt-1">Try a different keyword</p>
        </div>
      )}
    </div>
  )
}