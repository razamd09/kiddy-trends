'use client'
import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import CheckoutModal from './CheckoutModal'

export default function RecentlyViewed({ currentProductId }) {
  const [viewed, setViewed] = useState([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('recently_viewed') || '[]')
      const filtered = stored.filter(p => p.id !== currentProductId).slice(0, 4)
      setViewed(filtered)
    } catch {}
  }, [currentProductId])

  if (viewed.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h2 className="section-title mb-6">Recently Viewed 👀</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {viewed.map(product => {
          const price = parseFloat(product.variants?.[0]?.price || 0)
          const image = product.images?.[0]?.src
          return (
            <a key={product.id} href={'/products/' + product.handle}
              className="bg-white rounded-3xl overflow-hidden card-hover shadow-sm border border-gray-100 block">
              <div className="relative bg-white" style={{paddingBottom:'100%'}}>
                {image ? (
                  <div className="absolute inset-0 flex items-center justify-center p-3">
                    <img src={image} alt={product.title}
                      className="w-full h-full object-contain mix-blend-multiply" loading="lazy" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-5xl">👕</div>
                )}
              </div>
              <div className="p-3">
                <p className="font-display text-xs text-charcoal line-clamp-2">{product.title}</p>
                <p className="text-coral font-bold text-sm mt-1">PKR {price.toLocaleString()}</p>
              </div>
            </a>
          )
        })}
      </div>

      {showCheckout && selectedProduct && (
        <CheckoutModal
          product={selectedProduct}
          variant={selectedProduct.variants?.[0]}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </section>
  )
}