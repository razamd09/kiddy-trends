'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const BRAND_TILE_COLORS = ['bg-coral text-white', 'bg-skyblue text-charcoal', 'bg-mint text-charcoal', 'bg-sunny text-charcoal', 'bg-charcoal text-white']

export default function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBrands() {
      try {
        const data = await fetch('/api/product-brands').then(r => r.json())
        setBrands(Array.isArray(data?.brands) ? data.brands : [])
      } catch { setBrands([]) }
      setLoading(false)
    }
    fetchBrands()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="section-title mb-3">Shop by Brand 🏷️</h1>
        <p className="text-gray-500 text-lg">Pick a brand to see everything they've got</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col items-center gap-3 animate-pulse">
              <div className="w-full aspect-square rounded-xl bg-gray-100" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="font-display text-2xl">No brands yet</h3>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {brands.map((brand, i) => (
            <Link
              key={brand.id}
              href={'/collections?brand=' + encodeURIComponent(brand.name)}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-center card-hover hover:border-coral/40 transition-colors"
            >
              {brand.image ? (
                <span className="w-full aspect-square rounded-xl overflow-hidden border border-gray-100 bg-white flex items-center justify-center">
                  <img src={brand.image} alt={brand.name} className="w-full h-full object-contain p-3" loading="lazy" />
                </span>
              ) : (
                <span className={'w-full aspect-square rounded-xl flex items-center justify-center font-display text-2xl ' + BRAND_TILE_COLORS[i % BRAND_TILE_COLORS.length]}>
                  {brand.name.slice(0, 1)}
                </span>
              )}
              <span className="font-display text-sm text-charcoal leading-tight group-hover:text-coral transition-colors">{brand.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
