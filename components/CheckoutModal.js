'use client'
import { useState } from 'react'

const WHATSAPP_NUMBER = '923360677340'

const cities = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad',
  'Multan','Peshawar','Quetta','Sialkot','Gujranwala',
  'Hyderabad','Bahawalpur','Sargodha','Sukkur','Larkana','Other'
]

export default function CheckoutModal({ product, variant, onClose, isCart, cartItems, totalPrice: cartTotal }) {
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({
    name:'', phone:'', address:'', city:'', payment:'cod', notes:''
  })
  const [errors, setErrors] = useState({})

  const price        = isCart ? cartTotal : parseFloat(variant?.price || 0)
  const comparePrice = parseFloat(variant?.compare_at_price || 0)
  const isOnSale     = !isCart && comparePrice > price
  const image        = product?.images?.[0]?.src
  const shipping     = 200
  const total        = price + shipping

  function validate() {
    const e = {}
    if (!form.name.trim())             e.name    = 'Name is required'
    if (!form.phone.trim())            e.phone   = 'Phone is required'
    if (form.phone.trim().length < 10) e.phone   = 'Enter valid phone number'
    if (!form.address.trim())          e.address = 'Address is required'
    if (!form.city)                    e.city    = 'Please select your city'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function buildWhatsAppMessage() {
    const variantText = variant?.title !== 'Default Title' ? '\nVariant: ' + variant?.title : ''
    const productText = isCart
      ? cartItems?.map(item =>
          '- ' + item.title +
          (item.variantTitle ? ' (' + item.variantTitle + ')' : '') +
          ' x' + item.quantity +
          ' = PKR ' + (item.price * item.quantity).toLocaleString()
        ).join('\n')
      : product?.title + variantText

    const msg =
      'NEW ORDER - Kiddy Trends\n\n' +
      (isCart ? 'Products:\n' + productText : 'Product: ' + productText) + '\n' +
      'Subtotal: PKR ' + price.toLocaleString() + '\n' +
      'Shipping: PKR ' + shipping.toLocaleString() + '\n' +
      'Total: PKR ' + total.toLocaleString() + '\n\n' +
      'Customer Details\n' +
      'Name: ' + form.name + '\n' +
      'Phone: ' + form.phone + '\n' +
      'Address: ' + form.address + ', ' + form.city + '\n' +
      'Payment: ' + (form.payment === 'cod' ? 'Cash on Delivery' : 'Online Payment') +
      (form.notes ? '\nNotes: ' + form.notes : '') + '\n\n' +
      'Order placed via kiddytrends.com'

    return encodeURIComponent(msg)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    setStep(2)
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + buildWhatsAppMessage(), '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="font-display text-2xl text-charcoal">
            {step === 1 ? 'Complete Your Order' : 'Order Placed!'}
          </h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-coral hover:text-white transition-colors flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step 1 - Form */}
        {step === 1 && (
          <div className="px-6 py-5">

            {/* Order Summary */}
            <div className="bg-cream rounded-2xl p-4 mb-6">
              {isCart ? (
                <div className="space-y-2">
                  <p className="font-display text-base text-charcoal mb-3">
                    Order Summary ({cartItems?.length} items)
                  </p>
                  {cartItems?.map(item => (
                    <div key={item.variantId} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.image
                          ? <img src={item.image} alt={item.title} className="w-full h-full object-contain mix-blend-multiply p-0.5" />
                          : <span className="text-lg">👕</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-charcoal truncate">{item.title}</p>
                        {item.variantTitle && <p className="text-xs text-gray-400">{item.variantTitle}</p>}
                      </div>
                      <p className="text-xs font-bold text-coral whitespace-nowrap">
                        x{item.quantity} — PKR {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    {image
                      ? <img src={image} alt={product.title} className="w-full h-full object-contain mix-blend-multiply p-1 rounded-xl" />
                      : <span className="text-3xl">👕</span>
                    }
                  </div>
                  <div className="flex-1">
                    <h4 className="font-display text-sm text-charcoal leading-tight">{product?.title}</h4>
                    {variant?.title !== 'Default Title' && (
                      <p className="text-xs text-gray-400 mt-0.5">{variant?.title}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-coral font-bold">PKR {price.toLocaleString()}</p>
                      {isOnSale && <p className="text-gray-400 text-xs line-through">PKR {comparePrice.toLocaleString()}</p>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">+ PKR {shipping} shipping</p>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block font-semibold text-sm text-charcoal mb-1">Full Name *</label>
                <input type="text" placeholder="e.g. Sara Ahmed" value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className={`w-full px-4 py-3 rounded-2xl border-2 focus:outline-none text-sm ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-coral bg-cream'}`} />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block font-semibold text-sm text-charcoal mb-1">Phone Number *</label>
                <input type="tel" placeholder="e.g. 0336 0677340" value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  className={`w-full px-4 py-3 rounded-2xl border-2 focus:outline-none text-sm ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-coral bg-cream'}`} />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block font-semibold text-sm text-charcoal mb-1">City *</label>
                <select value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                  className={`w-full px-4 py-3 rounded-2xl border-2 focus:outline-none text-sm ${errors.city ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-coral bg-cream'}`}>
                  <option value="">Select your city</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block font-semibold text-sm text-charcoal mb-1">Delivery Address *</label>
                <textarea placeholder="House #, Street, Area..." value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})} rows={2}
                  className={`w-full px-4 py-3 rounded-2xl border-2 focus:outline-none text-sm resize-none ${errors.address ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-coral bg-cream'}`} />
                {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block font-semibold text-sm text-charcoal mb-2">Payment Method *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setForm({...form, payment:'cod'})}
                    className={`p-3 rounded-2xl border-2 text-center transition-all ${form.payment === 'cod' ? 'border-coral bg-coral/10' : 'border-gray-100 bg-cream hover:border-coral/40'}`}>
                    <div className="text-2xl mb-1">💵</div>
                    <p className="font-display text-sm text-charcoal">Cash on Delivery</p>
                    <p className="text-xs text-gray-400">Pay when received</p>
                  </button>
                  <button type="button" onClick={() => setForm({...form, payment:'online'})}
                    className={`p-3 rounded-2xl border-2 text-center transition-all ${form.payment === 'online' ? 'border-coral bg-coral/10' : 'border-gray-100 bg-cream hover:border-coral/40'}`}>
                    <div className="text-2xl mb-1">💳</div>
                    <p className="font-display text-sm text-charcoal">Online Payment</p>
                    <p className="text-xs text-gray-400">EasyPaisa / JazzCash</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-sm text-charcoal mb-1">Order Notes (optional)</label>
                <input type="text" placeholder="Any special instructions..." value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
              </div>

              <div className="bg-cream rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">PKR {price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-semibold">PKR {shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="font-display text-base text-charcoal">Total</span>
                  <span className="font-display text-lg text-coral">PKR {total.toLocaleString()}</span>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-coral text-white font-display text-lg py-4 rounded-2xl hover:bg-opacity-90 transition-all hover:scale-[1.02] active:scale-95 shadow-md disabled:opacity-70">
                {loading ? 'Placing Order...' : 'Place Order via WhatsApp'}
              </button>
              <p className="text-center text-xs text-gray-400">
                Your order details will be sent to our WhatsApp for confirmation
              </p>
            </form>
          </div>
        )}

        {/* Step 2 - Success */}
        {step === 2 && (
          <div className="px-6 py-10 text-center">
            <div className="text-7xl mb-4">🎉</div>
            <h3 className="font-display text-3xl text-charcoal mb-3">Order Placed!</h3>
            <p className="text-gray-500 mb-2">
              {isCart ? 'Your cart order has been received!' : 'Your order for ' + product?.title + ' has been received!'}
            </p>
            <p className="text-gray-500 mb-6">
              We have opened WhatsApp with your order details. Our team will confirm shortly.
            </p>
            <div className="bg-cream rounded-2xl p-4 text-left mb-6 space-y-2">
              <p className="text-sm"><span className="font-semibold">Name:</span> {form.name}</p>
              <p className="text-sm"><span className="font-semibold">Phone:</span> {form.phone}</p>
              <p className="text-sm"><span className="font-semibold">City:</span> {form.city}</p>
              <p className="text-sm"><span className="font-semibold">Payment:</span> {form.payment === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
              <p className="text-sm"><span className="font-semibold">Total:</span> <span className="text-coral font-bold">PKR {total.toLocaleString()}</span></p>
            </div>
            <a href={'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + buildWhatsAppMessage()}
              target="_blank" rel="noopener noreferrer"
              className="w-full bg-green-500 text-white font-display text-base py-3 rounded-2xl hover:bg-green-600 transition-colors block text-center mb-3">
              Open WhatsApp Again
            </a>
            <button onClick={onClose}
              className="w-full border-2 border-gray-200 text-charcoal font-display text-base py-3 rounded-2xl hover:border-coral hover:text-coral transition-colors">
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  )
}