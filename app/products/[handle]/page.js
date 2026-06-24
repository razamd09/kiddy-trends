'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '../../../components/ProductCard'
import { useCart } from '../../../context/CartContext'
import CheckoutModal from '../../../components/CheckoutModal'

const STORE_DOMAIN = 'the-kiddy-trends.myshopify.com'

export default function ProductPage() {
  const { handle } = useParams()
  const { addToCart, cart } = useCart()

  const [product, setProduct]                 = useState(null)
  const [related, setRelated]                 = useState([])
  const [loading, setLoading]                 = useState(true)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedImage, setSelectedImage]     = useState(0)
  const [added, setAdded]                     = useState(false)
  const [showCheckout, setShowCheckout]       = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res  = await fetch('https://' + STORE_DOMAIN + '/products/' + handle + '.json')
        const data = await res.json()
        if (data.product) {
          setProduct(data.product)
          setSelectedVariant(data.product.variants?.[0])
        }
        setLoading(false)
      } catch { setLoading(false) }
    }
    if (handle) fetchProduct()
  }, [handle])

  useEffect(() => {
    async function fetchRelated() {
      if (!product) return
      try {
        const res  = await fetch('https://' + STORE_DOMAIN + '/products.json?limit=250')
        const data = await res.json()
        const type = (product.product_type || '').toLowerCase()
        const productTags = typeof product.tags === 'string'
          ? product.tags.split(',').map(t => t.trim())
          : (product.tags || [])
        const filtered = (data.products || [])
          .filter(p => {
            if (p.id === product.id) return false
            const pTags = typeof p.tags === 'string'
              ? p.tags.split(',').map(t => t.trim())
              : (p.tags || [])
            return (p.product_type || '').toLowerCase() === type ||
              pTags.some(t => productTags.includes(t))
          })
          .slice(0, 4)
        setRelated(filtered)
      } catch {}
    }
    fetchRelated()
  }, [product])

  const price        = parseFloat(selectedVariant?.price || 0)
  const comparePrice = parseFloat(selectedVariant?.compare_at_price || 0)
  const isOnSale     = comparePrice > price
  const isSoldOut = false
  const inCart       = cart.find(i => i.variantId === selectedVariant?.id)?.quantity || 0
  const isMaxed      = inCart >= 2

  const hasVariants = product?.variants?.length > 1 &&
    !(product?.variants?.length === 1 && product?.variants[0]?.title === 'Default Title')

  function handleAddToCart() {
    if (isSoldOut || isMaxed) return
    addToCart(product, selectedVariant, 2, true)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-2 gap-10 animate-pulse">
        <div className="bg-gray-100 rounded-3xl aspect-square" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded w-3/4" />
          <div className="h-6 bg-gray-100 rounded w-1/4" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="text-6xl mb-4">😕</div>
      <h2 className="font-display text-3xl text-charcoal mb-4">Product not found</h2>
      <Link href="/collections" className="btn-primary">Back to Collections</Link>
    </div>
  )

  const productTags = typeof product.tags === 'string'
    ? product.tags.split(',').map(t => t.trim()).filter(Boolean)
    : (product.tags || [])

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-coral transition-colors">Home</Link>
          <span>›</span>
          <Link href="/collections" className="hover:text-coral transition-colors">Collections</Link>
          <span>›</span>
          <span className="text-charcoal font-semibold truncate max-w-xs">{product.title}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 mb-16">

          {/* Images */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl overflow-hidden aspect-square flex items-center justify-center p-6 shadow-sm border border-gray-100">
              {product.images?.length > 0 ? (
                <img src={product.images[selectedImage]?.src} alt={product.title}
                  className="w-full h-full object-contain mix-blend-multiply" />
              ) : (
                <span className="text-8xl">👕</span>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-3 flex-wrap">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={'w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ' + (selectedImage === i ? 'border-coral scale-105' : 'border-gray-100 hover:border-coral/40')}>
                    <img src={img.src} alt={product.title + ' ' + (i+1)}
                      className="w-full h-full object-contain mix-blend-multiply p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex flex-wrap gap-2 mb-4">
              {isOnSale && <span className="bg-coral text-white text-xs px-3 py-1 rounded-full font-bold">SALE</span>}
              {isSoldOut && <span className="bg-gray-400 text-white text-xs px-3 py-1 rounded-full font-bold">Sold Out</span>}
              {product.product_type && <span className="bg-skyblue/30 text-charcoal text-xs px-3 py-1 rounded-full font-semibold">{product.product_type}</span>}
            </div>

            <h1 className="font-display text-3xl md:text-4xl text-charcoal leading-tight mb-4">{product.title}</h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="font-display text-3xl text-coral">PKR {price.toLocaleString()}</span>
              {isOnSale && <span className="font-display text-xl text-gray-400 line-through">PKR {comparePrice.toLocaleString()}</span>}
              {isOnSale && <span className="bg-coral/10 text-coral text-sm px-3 py-1 rounded-full font-bold">Save PKR {(comparePrice - price).toLocaleString()}</span>}
            </div>

            {hasVariants && (
              <div className="mb-6">
                <p className="font-semibold text-sm text-charcoal mb-3">
                  {product.options?.[0]?.name || 'Size'}:
                  <span className="text-coral ml-2">{selectedVariant?.title}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => (
                    <button key={v.id} onClick={() => setSelectedVariant(v)} disabled={!v.available}
                      className={'px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ' + (
                        selectedVariant?.id === v.id ? 'border-coral bg-coral text-white'
                        : !v.available ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                        : 'border-gray-200 text-charcoal hover:border-coral'
                      )}>
                      {v.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-cream rounded-2xl p-4 mb-6 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span>🚚</span>
                <span className="text-gray-600">Flat shipping <strong className="text-charcoal">PKR 250</strong> across Pakistan</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>💵</span>
                <span className="text-gray-600"><strong className="text-charcoal">Cash on Delivery</strong> available</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>📦</span>
                <span className="text-gray-600">Delivery in <strong className="text-charcoal">3-5 business days</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>↩️</span>
                <span className="text-gray-600"><strong className="text-charcoal">7-day returns</strong> — hassle free</span>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button onClick={handleAddToCart} disabled={isSoldOut || isMaxed}
                className={'flex-1 py-4 rounded-2xl font-display text-base border-2 transition-all ' + (
                  isSoldOut ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : isMaxed ? 'border-orange-200 text-orange-300 cursor-not-allowed'
                  : added ? 'border-mint bg-mint text-white'
                  : 'border-charcoal text-charcoal hover:bg-charcoal hover:text-white'
                )}>
                {isSoldOut ? 'Sold Out' : isMaxed ? 'Max Qty Reached' : added ? '✓ Added!' : '+ Add to Cart'}
              </button>
              <button onClick={() => !isSoldOut && setShowCheckout(true)} disabled={isSoldOut}
                className={'flex-1 py-4 rounded-2xl font-display text-base transition-all ' + (
                  isSoldOut ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-coral text-white hover:bg-opacity-90 hover:scale-[1.02]'
                )}>
                Buy Now
              </button>
            </div>

            <Link href="/size-chart" className="text-center text-sm text-coral hover:underline mb-6 block">
              📏 View Size Chart
            </Link>

            {product.body_html && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-display text-xl text-charcoal mb-3">Product Details</h3>
                <div className="text-sm text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.body_html }} />
              </div>
            )}

            {productTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {productTags.slice(0, 6).map(tag => (
                  <span key={tag} className="bg-cream text-gray-500 text-xs px-3 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section>
            <h2 className="section-title mb-8">You might also like 💛</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {showCheckout && (
        <CheckoutModal product={product} variant={selectedVariant} onClose={() => setShowCheckout(false)} />
      )}
    </>
  )
}