'use client'
import { useState } from 'react'

const statusSteps = [
  { id: 'pending',    icon: '✅', label: 'Order Placed',  desc: 'Your order has been received' },
  { id: 'processing', icon: '⚙️', label: 'Processing',    desc: 'We are preparing your order' },
  { id: 'dispatched', icon: '🚚', label: 'Dispatched',    desc: 'Your order is on the way' },
  { id: 'delivered',  icon: '🎉', label: 'Delivered',     desc: 'Your order has been delivered' },
]

const statusIndex = { pending: 0, processing: 1, dispatched: 2, delivered: 3, cancelled: -1 }

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState('')
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  async function handleTrack(e) {
    e.preventDefault()
    if (!orderNumber.trim()) { setError('Please enter your order number'); return }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res  = await fetch('/api/orders/track?order_number=' + encodeURIComponent(orderNumber.trim()))
      const data = await res.json()
      if (data.success) {
        setResult(data.order)
      } else {
        setError(data.error || 'Order not found')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  function getItems(order) {
    try {
      return typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])
    } catch { return [] }
  }

  const currentStep = result ? statusIndex[result.status] : -1

  return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">📦</div>
          <h1 className="section-title mb-3">Track Your Order</h1>
          <p className="text-gray-500">Enter your order number to see the latest status</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleTrack} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="mb-4">
            <label className="block font-semibold text-sm text-charcoal mb-2">Order Number</label>
            <input type="text" placeholder="e.g. KT101, KT102..."
                   value={orderNumber}
                   onChange={e => { setOrderNumber(e.target.value.toUpperCase()); setError('') }}
                   className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm font-bold tracking-wider" />
            <p className="text-xs text-gray-400 mt-2">Your order number was shared after placing the order e.g. KT101</p>
          </div>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button type="submit" disabled={loading}
                  className="w-full bg-coral text-white font-display text-base py-4 rounded-2xl hover:bg-opacity-90 transition-all disabled:opacity-70">
            {loading ? 'Searching...' : 'Track My Order 🔍'}
          </button>
        </form>

        {/* Result */}
        {result && (
            <div className="space-y-4">

              {/* Order header */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-display text-2xl text-coral">{result.order_number}</p>
                    <p className="text-xs text-gray-400">
                      Placed on {new Date(result.created_at).toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  {result.status === 'cancelled' ? (
                      <span className="bg-red-100 text-red-500 font-bold text-sm px-4 py-2 rounded-full">❌ Cancelled</span>
                  ) : (
                      <span className="bg-green-100 text-green-600 font-bold text-sm px-4 py-2 rounded-full">
                  {result.status === 'delivered' ? '✅ Delivered' : '🔄 In Progress'}
                </span>
                  )}
                </div>
                <div className="bg-cream rounded-2xl p-4 text-sm space-y-1">
                  <p><span className="text-gray-400">Customer:</span> <span className="font-semibold">{result.customer_name}</span></p>
                  <p><span className="text-gray-400">City:</span> <span className="font-semibold">{result.customer_city}</span></p>
                  <p><span className="text-gray-400">Total:</span> <span className="font-bold text-coral">PKR {result.total?.toLocaleString()}</span></p>
                </div>
              </div>

              {/* Status tracker */}
              {result.status !== 'cancelled' && (
                  <div className="bg-white rounded-3xl p-6 border border-gray-100">
                    <p className="font-display text-lg text-charcoal mb-5">Order Progress</p>
                    <div className="space-y-4">
                      {statusSteps.map((step, i) => {
                        const isDone    = i <= currentStep
                        const isCurrent = i === currentStep
                        return (
                            <div key={step.id} className="flex items-center gap-4">
                              <div className={'w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 transition-all ' +
                                  (isDone ? 'bg-coral/20 scale-110' : 'bg-gray-100')}>
                                {step.icon}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={'font-semibold text-sm ' + (isDone ? 'text-charcoal' : 'text-gray-300')}>
                                    {step.label}
                                  </p>
                                  {isCurrent && (
                                      <span className="text-xs bg-coral text-white px-2 py-0.5 rounded-full animate-pulse font-bold">
                              Current
                            </span>
                                  )}
                                </div>
                                {isDone && <p className="text-xs text-gray-400">{step.desc}</p>}
                              </div>
                              {isDone && <span className="text-coral text-xl font-bold">✓</span>}
                            </div>
                        )
                      })}
                    </div>
                  </div>
              )}

              {/* Items */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100">
                <p className="font-display text-lg text-charcoal mb-4">Order Items</p>
                <div className="space-y-2">
                  {getItems(result).length === 0 ? (
                      <p className="text-sm text-gray-400">No item details available</p>
                  ) : getItems(result).map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-cream rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.image && <img src={item.image} alt="" className="w-10 h-10 object-contain rounded-lg" />}
                          <div>
                            <p className="font-semibold text-sm text-charcoal">{item.title}</p>
                            {item.variantTitle && <p className="text-xs text-gray-400">{item.variantTitle}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">x{item.quantity}</p>
                          <p className="font-bold text-coral text-sm">PKR {(parseFloat(item.price||0) * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 mt-4 pt-4 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span><span>PKR {(result.subtotal||0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping</span><span>PKR {(result.shipping||250).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-display text-base pt-1 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-coral font-bold">PKR {(result.total||0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Help */}
              <div className="bg-cream rounded-3xl p-5 text-center">
                <p className="font-display text-base text-charcoal mb-1">Need Help?</p>
                <p className="text-sm text-gray-500 mb-4">Contact us directly on WhatsApp for instant support</p>
                <a href={'https://wa.me/923360677340?text=' + encodeURIComponent('Hi! I need help with my order ' + result.order_number)}
                   target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 bg-green-500 text-white font-display px-6 py-3 rounded-full hover:bg-green-600 transition-colors">
                  💬 WhatsApp Us
                </a>
              </div>
            </div>
        )}

        {/* Default help */}
        {!result && !loading && !error && (
            <div className="bg-cream rounded-3xl p-6 text-center">
              <p className="font-display text-base text-charcoal mb-1">Need Help?</p>
              <p className="text-sm text-gray-500 mb-4">Can't find your order? Contact us directly</p>
              <a href="https://wa.me/923360677340" target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 bg-green-500 text-white font-display px-6 py-3 rounded-full hover:bg-green-600 transition-colors">
                💬 WhatsApp Us
              </a>
            </div>
        )}
      </div>
  )
}