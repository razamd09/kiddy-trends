'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '../../context/CartContext'
import { formatPakistanDateTime } from '../../lib/dateFormat'

const statusConfig = {
  pending:    { color: 'bg-orange-100 text-orange-600', icon: '⏳', label: 'Pending' },
  processing: { color: 'bg-blue-100 text-blue-600',       icon: '⚙️', label: 'Processing' },
  dispatched: { color: 'bg-purple-100 text-purple-600', icon: '🚚', label: 'Dispatched' },
  delivered:  { color: 'bg-green-100 text-green-600',    icon: '✅', label: 'Delivered' },
  cancelled:  { color: 'bg-red-100 text-red-500',        icon: '❌', label: 'Cancelled' },
}

function getItems(order) {
  try {
    return typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])
  } catch {
    return []
  }
}

export default function MyOrdersPage() {
  const { addToCart, setCartOpen } = useCart()
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reorderingId, setReorderingId] = useState(null)
  const [reorderMessage, setReorderMessage] = useState({})

  async function handleLookup(e) {
    e.preventDefault()
    const trimmed = phone.trim()
    if (!trimmed) {
      setError('Please enter your phone number')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders/by-phone?phone=' + encodeURIComponent(trimmed))
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Something went wrong')
      setOrders(data.orders || [])
    } catch (err) {
      setError(err.message || 'Something went wrong, please try again')
      setOrders(null)
    }
    setLoading(false)
  }

  async function handleReorder(order) {
    setReorderingId(order.id)
    setReorderMessage((prev) => ({ ...prev, [order.id]: '' }))
    const items = getItems(order)
    let added = 0
    let unavailable = 0

    for (const item of items) {
      try {
        const res = await fetch('/api/products?handle=' + encodeURIComponent('prd_id=' + item.productId), { cache: 'no-store' })
        const data = await res.json()
        const product = data.success && data.products?.length > 0 ? data.products[0] : null
        const variant = product?.variants?.find((v) => v.id === item.variantId) || product?.variants?.[0]

        if (!product || !variant || variant.available === false) {
          unavailable += 1
          continue
        }

        const quantity = Math.max(1, Number(item.quantity) || 1)
        for (let i = 0; i < quantity; i++) {
          addToCart(product, variant)
        }
        added += 1
      } catch {
        unavailable += 1
      }
    }

    setReorderingId(null)
    if (added > 0) {
      setReorderMessage((prev) => ({ ...prev, [order.id]: { ok: true, text: unavailable > 0 ? `Added ${added} item(s) to cart — ${unavailable} item(s) no longer available.` : 'Added to cart!' } }))
      setCartOpen(true)
    } else {
      setReorderMessage((prev) => ({ ...prev, [order.id]: { ok: false, text: 'Sorry, none of these items are available anymore.' } }))
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="text-center mb-10">
        <h1 className="section-title mb-3">My Orders 📦</h1>
        <p className="text-gray-500 text-lg">Enter your phone number to see everything you've ordered.</p>
      </div>

      <form onSubmit={handleLookup} className="flex gap-2 max-w-md mx-auto mb-10">
        <div className="bg-cream border-2 border-gray-100 rounded-2xl px-3 flex items-center text-sm font-bold text-charcoal flex-shrink-0">🇵🇰 +92</div>
        <input type="tel" placeholder="3360677340" value={phone}
          onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
          className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
        <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap disabled:opacity-60">
          {loading ? 'Searching…' : 'Find Orders'}
        </button>
      </form>
      {error && <p className="text-center text-red-500 text-sm -mt-6 mb-8">{error}</p>}

      {orders && orders.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="font-display text-2xl text-gray-400">No orders found for this number</h3>
          <p className="text-gray-400 mt-2 mb-6">Double-check the number, or place your first order!</p>
          <Link href="/collections" className="btn-primary">Browse Collections</Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = getItems(order)
            const status = statusConfig[order.status] || statusConfig.pending
            return (
              <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <p className="font-display text-lg text-charcoal">{order.order_number || 'Order #' + order.id}</p>
                    <p className="text-xs text-gray-400">{formatPakistanDateTime(order.created_at)}</p>
                  </div>
                  <span className={'text-xs px-3 py-1 rounded-full font-bold ' + status.color}>
                    {status.icon} {status.label}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  {items.slice(0, 4).map((item, i) => (
                    <p key={i} className="text-sm text-gray-600 truncate">
                      {item.quantity}× {item.title}{item.variantTitle ? ' (' + item.variantTitle + ')' : ''}
                    </p>
                  ))}
                  {items.length > 4 && <p className="text-xs text-gray-400">+ {items.length - 4} more item(s)</p>}
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <p className="font-display text-lg text-coral">PKR {Number(order.total || 0).toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <Link href={'/order-tracking'} className="text-xs font-semibold text-gray-500 hover:text-coral transition-colors">
                      Track
                    </Link>
                    <button onClick={() => handleReorder(order)} disabled={reorderingId === order.id}
                      className="text-xs bg-coral text-white px-4 py-2 rounded-full font-bold hover:bg-opacity-90 disabled:opacity-60">
                      {reorderingId === order.id ? 'Adding…' : '🔁 Reorder'}
                    </button>
                  </div>
                </div>
                {reorderMessage[order.id] && (
                  <p className={'text-xs font-semibold mt-2 text-right ' + (reorderMessage[order.id].ok ? 'text-mint' : 'text-red-500')}>
                    {reorderMessage[order.id].text}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
