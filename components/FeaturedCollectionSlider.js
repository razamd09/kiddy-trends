'use client'
import { useEffect, useRef, useState } from 'react'
import ProductCard from './ProductCard'

export default function FeaturedCollectionSlider() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollerRef = useRef(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('/api/featured-collection', { cache: 'no-store' })
        const data = await res.json()
        if (mounted) setProducts(data.success ? (data.products || []) : [])
      } catch {
        if (mounted) setProducts([])
      }
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  function scrollBy(amount) {
    scrollerRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
  }

  // Nothing pinned to any active campaign right now — the section just
  // doesn't render rather than showing an empty shell.
  if (!loading && products.length === 0) return null

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="section-title">Featured Collection</h2>
          <p className="text-gray-500 text-sm mt-2">Hand-picked from our latest campaigns</p>
        </div>
        {!loading && products.length > 4 && (
          <div className="hidden sm:flex gap-2 flex-shrink-0">
            <button type="button" onClick={() => scrollBy(-320)} aria-label="Scroll left"
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-coral/40 flex items-center justify-center text-charcoal">
              ‹
            </button>
            <button type="button" onClick={() => scrollBy(320)} aria-label="Scroll right"
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-coral/40 flex items-center justify-center text-charcoal">
              ›
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex gap-5 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[45vw] sm:w-56 md:w-64 bg-gray-100 rounded-xl overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div ref={scrollerRef} className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product) => (
            <div key={product._id} className="flex-shrink-0 w-[45vw] sm:w-56 md:w-64 snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
