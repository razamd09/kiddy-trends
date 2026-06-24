'use client'
import { useState } from 'react'
import { useCart } from '../context/CartContext'
import CheckoutModal from './CheckoutModal'

export default function ProductCard({ product }) {
  const { addToCart, cart } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0])
  const [added, setAdded]               = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  const price        = parseFloat(selectedVariant?.price || 0)
  const comparePrice = parseFloat(selectedVariant?.compare_at_price || 0)
  const image        = product.images?.[0]?.src
  const isOnSale     = comparePrice > price
  const isSoldOut    = !selectedVariant?.available
  const inCart       = cart.find(i => i.variantId === selectedVariant?.id)?.quantity || 0
  const isMaxed      = inCart >= 2

  const hasVariants = product.variants?.length > 1 &&
    !(product.variants.length === 1 && product.variants[0].title === 'Default Title')

  function handleAddToCart() {
    if (isSoldOut || isMaxed) return
    addToCart(product, selectedVariant, 2, true)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <>
      <div className="bg-white rounded-3xl overflow-hidden card-hover shadow-sm border border-gray-100 flex flex-col">

        {/* Image — links to product page */}
        <a href={'/products/' + product.handle} className="block relative bg-white" style={{paddingBottom:'100%'}}>
          {image ? (
            <div className="absolute inset-0 bg-white flex items-center justify-center p-3">
              <img src={image} alt={product.title}
                className="w-full h-full object-contain mix-blend-multiply" loading="lazy" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl bg-white">👕</div>
          )}
          {isOnSale && !isSoldOut && (
            <span className="absolute top-2 left-2 bg-coral text-white text-xs px-2 py-1 rounded-full font-bold z-10">SALE</span>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
              <span className="bg-white text-charcoal font-display text-sm px-3 py-1 rounded-full">Sold Out</span>
            </div>
          )}
        </a>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <a href={'/products/' + product.handle}>
            <h4 className="font-display text-sm text-charcoal leading-tight line-clamp-2 flex-1 hover:text-coral transition-colors">
              {product.title}
            </h4>
          </a>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-coral font-bold text-sm">PKR {price.toLocaleString()}</p>
            {isOnSale && <p className="text-gray-400 text-xs line-through">PKR {comparePrice.toLocaleString()}</p>}
          </div>

          {/* Variant selector */}
          {hasVariants && (
            <select value={selectedVariant?.id}
              onChange={e => {
                const v = product.variants.find(v => v.id === parseInt(e.target.value))
                setSelectedVariant(v)
              }}
              className="mt-2 w-full text-xs border-2 border-gray-100 rounded-xl px-2 py-1.5 focus:outline-none focus:border-coral bg-cream font-semibold">
              {product.variants.map(v => (
                <option key={v.id} value={v.id} disabled={!v.available}>
                  {v.title} {!v.available ? '(Sold Out)' : '— PKR ' + parseFloat(v.price).toLocaleString()}
                </option>
              ))}
            </select>
          )}

          {/* Buttons */}
          <div className="flex gap-2 mt-3">
            <button onClick={handleAddToCart} disabled={isSoldOut || isMaxed}
              className={'flex-1 text-xs font-bold py-2.5 rounded-xl border-2 transition-all ' + (
                isSoldOut ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : isMaxed ? 'border-orange-200 text-orange-300 cursor-not-allowed'
                : added ? 'border-mint bg-mint text-white'
                : 'border-charcoal text-charcoal hover:bg-charcoal hover:text-white'
              )}>
              {isSoldOut ? 'Sold Out' : isMaxed ? 'Max Qty' : added ? '✓ Added!' : '+ Cart'}
            </button>
            <button onClick={() => !isSoldOut && setShowCheckout(true)} disabled={isSoldOut}
              className={'flex-1 text-xs font-bold py-2.5 rounded-xl transition-all ' + (
                isSoldOut ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-coral text-white hover:bg-opacity-90'
              )}>
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          product={product}
          variant={selectedVariant}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </>
  )
}