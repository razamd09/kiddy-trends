'use client'
import { useState } from 'react'
import { useCart } from '../context/CartContext'
import CheckoutModal from './CheckoutModal'
import WishlistButton from './WishlistButton'


function getCardRating(productId) {
  if (productId % 100 > 50) return null
  return (productId % 2 === 0) ? 5 : 4
}

// Fake low stock — shows on ~40% of products
function getLowStock(productId) {
  const seed = productId % 10
  if (seed > 4) return null
  const stocks = [1, 2, 3, 2, 1, 3, 2, 1, 3, 2]
  return stocks[seed]
}

// Fake discount % based on category
function getFakeDiscount(product) {
  const type  = (product.product_type || '').toLowerCase()
  const title = (product.title || '').toLowerCase()
  if (type.includes('bag') || type.includes('backpack') || title.includes('bag')) return 25
  if (type.includes('bed') || type.includes('sheet') || title.includes('bed')) return 30
  if (type.includes('access') || title.includes('pin') || title.includes('hair')) return 20
  return 50 // clothing default
}

export default function ProductCard({ product }) {
  const { addToCart, cart } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0])
  const [added, setAdded]               = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  const price        = parseFloat(selectedVariant?.price || 0)
  const comparePrice = parseFloat(selectedVariant?.compare_at_price || 0)
  const image        = product.images?.[0]?.src
  const isSoldOut    = selectedVariant ? selectedVariant.available === false : false
  const inCart       = cart.find(i => i.variantId === selectedVariant?.id)?.quantity || 0
  const isMaxed      = inCart >= 2
  const rating       = getCardRating(product.id)
  const lowStock     = getLowStock(product.id)
  const discountPct  = getFakeDiscount(product)

  // If no compare price set by Shopify, generate fake original price
  const hasRealSale    = comparePrice > price
  const fakeOriginal   = hasRealSale ? comparePrice : Math.round(price * (1 + discountPct / 100) / 100) * 100
  const displayOriginal = fakeOriginal
  const isOnSale       = true // always show sale

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

        {/* Image */}
        <a href={'/products/' + product.handle} className="block relative bg-white" style={{paddingBottom:'100%'}}>
  <WishlistButton product={product} />
          {image ? (
            <div className="absolute inset-0 bg-white flex items-center justify-center p-3">
              <img src={image} alt={product.title}
                className="w-full h-full object-contain mix-blend-multiply" loading="lazy" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl bg-white">👕</div>
          )}

          {/* Discount badge */}
          <span className="absolute top-2 left-2 bg-coral text-white text-xs px-2 py-1 rounded-full font-bold z-10">
            {discountPct}% OFF
          </span>

          {/* Low stock badge */}
          {lowStock && !isSoldOut && (
            <span className="absolute top-2 right-2 bg-sunny text-charcoal text-xs px-2 py-1 rounded-full font-bold z-10">
              Only {lowStock} left!
            </span>
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
            <h4 className="font-display text-sm text-charcoal leading-tight line-clamp-2 hover:text-coral transition-colors">
              {product.title}
            </h4>
          </a>

          {/* Star rating */}
          {rating && (
            <div className="flex items-center gap-1 mt-1.5">
              {[1,2,3,4,5].map(s => (
                <svg key={s} className={'w-3 h-3 ' + (s <= rating ? 'text-yellow-400' : 'text-gray-200')}
                  fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-xs text-gray-400 ml-0.5">({rating}.0)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mt-2">
            <p className="text-coral font-bold text-sm">PKR {price.toLocaleString()}</p>
            <p className="text-gray-400 text-xs line-through">PKR {displayOriginal.toLocaleString()}</p>
          </div>

          {/* Low stock warning text */}
          {lowStock && !isSoldOut && (
            <p className="text-orange-500 text-xs font-bold mt-1">🔥 Only {lowStock} left in stock!</p>
          )}

          {/* Variant selector */}
          {hasVariants && (
            <select value={selectedVariant?.id}
              onChange={e => {
                const v = product.variants.find(v => String(v.id) === String(e.target.value))
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