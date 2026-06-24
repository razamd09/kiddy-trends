'use client'
import { useState } from 'react'
import emailjs from '@emailjs/browser'
import RewardsSection from './RewardsSection'

const WHATSAPP_NUMBER  = '923360677340'
const EMAILJS_SERVICE  = 'service_9p08wct'
const EMAILJS_TEMPLATE = 'template_gyanmsp'
const EMAILJS_KEY      = 'G3OmrUP2PwOat-o1W'

const cities = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad',
  'Multan','Peshawar','Quetta','Sialkot','Gujranwala',
  'Hyderabad','Bahawalpur','Sargodha','Sukkur','Larkana',
  'Gujrat','Sheikhupura','Jhang','Rahim Yar Khan','Kasur',
  'Okara','Sahiwal','Wah Cantt','Attock','Chakwal',
  'Jhelum','Khanewal','Hafizabad','Chiniot','Kamoke',
  'Mandi Bahauddin','Narowal','Pakpattan','Bahawalnagar',
  'Vehari','Lodhran','Muzaffargarh','Layyah','Bhakkar',
  'Mianwali','Khushab','Toba Tek Singh','Nankana Sahib',
  'Mirpur Khas','Nawabshah','Jacobabad','Shikarpur','Khairpur',
  'Dadu','Badin','Thatta','Tando Adam','Tando Allahyar',
  'Sanghar','Umerkot','Ghotki','Kashmore','Kandhkot',
  'Mardan','Mingora','Abbottabad','Kohat','Bannu',
  'Dera Ismail Khan','Swabi','Nowshera','Charsadda','Haripur',
  'Mansehra','Karak','Lakki Marwat','Tank','Buner',
  'Turbat','Khuzdar','Hub','Chaman','Zhob',
  'Gwadar','Dera Murad Jamali','Sibi','Kharan',
  'Muzaffarabad','Mirpur','Kotli','Gilgit','Skardu','Rawalakot','Bagh',
  'DHA Karachi','Clifton','Gulshan-e-Iqbal','North Nazimabad',
  'DHA Lahore','Gulberg','Model Town','Johar Town','Bahria Town Lahore',
  'Bahria Town Karachi','Bahria Town Rawalpindi','F-7 Islamabad','G-9 Islamabad',
  'Hayatabad Peshawar','University Town Peshawar','Other'
].sort()

export default function CheckoutModal({ product, variant, onClose, isCart, cartItems, totalPrice: cartTotal }) {
  const [step, setStep]               = useState(1)
  const [loading, setLoading]         = useState(false)
  const [form, setForm]               = useState({
    name:'', phone:'', whatsapp:'', sameAsPhone: true, email:'', address:'', city:'', notes:''
  })
  const [errors, setErrors]           = useState({})
  const [coupon, setCoupon]           = useState('')
  const [discount, setDiscount]       = useState(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [rewards, setRewards]         = useState({ userId: '', points: 0, redeemed: 0 })
  const [earnedPoints, setEarnedPoints] = useState(0)
  const [bonusAwarded, setBonusAwarded] = useState(false)

  const price          = isCart ? cartTotal : parseFloat(variant?.price || 0)
  const comparePrice   = parseFloat(variant?.compare_at_price || 0)
  const isOnSale       = !isCart && comparePrice > price
  const image          = product?.images?.[0]?.src
  const shipping       = discount?.type === 'shipping' ? 0 : 250
  const discountAmount = discount
    ? discount.type === 'percent' ? Math.round(price * discount.value / 100)
    : discount.type === 'fixed'   ? Math.min(discount.value, price)
    : 0 : 0
  const rewardsDiscount = rewards.redeemed || 0
  const total = price + shipping - (discount?.type !== 'shipping' ? discountAmount : 0) - rewardsDiscount

  function formatPhone(val) { return val.replace(/\D/g, '').slice(0, 10) }
  function validatePhone(val) { return val.replace(/\D/g, '').length === 10 }

  function validate() {
    const e = {}
    if (!form.name.trim())    e.name    = 'Name is required'
    if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.phone.trim())   e.phone   = 'Phone is required'
    if (!validatePhone(form.phone)) e.phone = 'Enter 10 digits (e.g. 3360677340)'
    if (!form.sameAsPhone) {
      if (!form.whatsapp.trim())         e.whatsapp = 'WhatsApp number is required'
      if (!validatePhone(form.whatsapp)) e.whatsapp = 'Enter 10 digits'
    }
    if (!form.address.trim()) e.address = 'Address is required'
    if (!form.city)           e.city    = 'Please select your city'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function applyCoupon() {
    if (!coupon.trim()) return
    setCouponLoading(true)
    setCouponError('')
    setDiscount(null)
    const validCodes = {

      'KIDDY20':  { type: 'percent',  value: 20,  label: '20% OFF' },
      'WELCOME':  { type: 'percent',  value: 15,  label: '15% OFF' },
      'FLAT100':  { type: 'fixed',    value: 100, label: 'PKR 100 OFF' },
      'FLAT200':  { type: 'fixed',    value: 200, label: 'PKR 200 OFF' },
      'FREESHIP': { type: 'shipping', value: 250, label: 'Free Shipping' },
    }
    const code = coupon.trim().toUpperCase()
    if (validCodes[code]) {
      setDiscount({ ...validCodes[code], code })
      setCouponError('')
    } else {
      setCouponError('Invalid coupon code. Please try again.')
    }
    setCouponLoading(false)
  }

  function buildWhatsAppMessage() {
    const variantText = variant?.title !== 'Default Title' ? '\nVariant: ' + variant?.title : ''
    const productText = isCart
      ? cartItems?.map(item =>
          '- ' + item.title +
          (item.variantTitle ? ' (' + item.variantTitle + ')' : '') +
          ' x' + item.quantity + ' = PKR ' + (item.price * item.quantity).toLocaleString()
        ).join('\n')
      : product?.title + variantText
    const waNumber = form.sameAsPhone ? form.phone : form.whatsapp
    return encodeURIComponent(
      'NEW ORDER - Kiddy Trends\n\n' +
      (isCart ? 'Products:\n' + productText : 'Product: ' + productText) + '\n' +
      'Subtotal: PKR ' + price.toLocaleString() + '\n' +
      (discount ? 'Discount (' + discount.code + '): - PKR ' + discountAmount.toLocaleString() + '\n' : '') +
      (rewardsDiscount > 0 ? 'Rewards Discount: - PKR ' + rewardsDiscount + '\n' : '') +
      'Shipping: PKR ' + shipping.toLocaleString() + '\n' +
      'Total: PKR ' + total.toLocaleString() + '\n\n' +
      'Customer Details\n' +
      'Name: ' + form.name + '\n' +
      'Email: ' + (form.email || 'N/A') + '\n' +
      'Phone: +92' + form.phone + '\n' +
      'WhatsApp: +92' + waNumber + '\n' +
      'Address: ' + form.address + ', ' + form.city + '\n' +
      'Payment: Cash on Delivery' +
      (rewards.userId ? '\nRewards ID: ' + rewards.userId : '') +
      (form.notes ? '\nNotes: ' + form.notes : '') + '\n\n' +
      'Order placed via kiddytrends.com'
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const items    = isCart
        ? cartItems.map(i => ({ variantId: i.variantId, quantity: i.quantity }))
        : [{ variantId: variant?.id, quantity: 1 }]
      const waNumber = form.sameAsPhone ? form.phone : form.whatsapp
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: items,
          customer: {
            name:     form.name,
            email:    form.email,
            phone:    '+92' + form.phone,
            whatsapp: '+92' + waNumber,
            address:  form.address,
            city:     form.city,
            notes:    form.notes,
            payment:  'cod',
          }
        })
      })
      const data = await res.json()
      if (data.success) {
        // Send confirmation email
        if (form.email.trim()) {
          try {
            const orderItems = isCart
              ? cartItems.map(i => i.title + ' x' + i.quantity + ' = PKR ' + (i.price * i.quantity).toLocaleString()).join('\n')
              : (product?.title || '') + ' x1 = PKR ' + price.toLocaleString()
            await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
              customer_name:  form.name,
              customer_email: form.email,
              phone:          '+92' + form.phone,
              address:        form.address,
              city:           form.city,
              order_items:    orderItems,
              subtotal:       'PKR ' + price.toLocaleString(),
              shipping:       'PKR ' + shipping.toLocaleString(),
              total:          'PKR ' + total.toLocaleString(),
            }, EMAILJS_KEY)
          } catch (emailErr) { console.log('Email error:', emailErr) }
        }

        // Add reward points
        if (rewards.userId) {
          try {
            const rewardRes = await fetch('/api/rewards', {
              method:  'PUT',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ userId: rewards.userId, orderTotal: total })
            })
            const rewardData = await rewardRes.json()
            if (rewardData.success) {
              setEarnedPoints(rewardData.earned || 0)
              setBonusAwarded(rewardData.bonus || false)
            }
          } catch (e) { console.log('Rewards error:', e) }
        }

        setLoading(false)
        setStep(2)
      } else {
        setLoading(false)
        alert('Error: ' + (data.error || 'Something went wrong. Please try again.'))
      }
    } catch (err) {
      setLoading(false)
      alert('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="font-display text-2xl text-charcoal">
            {step === 1 ? 'Complete Your Order' : 'Order Confirmed!'}
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
                  <p className="font-display text-base text-charcoal mb-3">Order Summary ({cartItems?.length} items)</p>
                  {cartItems?.map(item => (
                    <div key={item.variantId} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-contain mix-blend-multiply p-0.5" /> : <span className="text-lg">👕</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-charcoal truncate">{item.title}</p>
                        {item.variantTitle && <p className="text-xs text-gray-400">{item.variantTitle}</p>}
                      </div>
                      <p className="text-xs font-bold text-coral whitespace-nowrap">x{item.quantity} — PKR {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    {image ? <img src={image} alt={product.title} className="w-full h-full object-contain mix-blend-multiply p-1 rounded-xl" /> : <span className="text-3xl">👕</span>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-display text-sm text-charcoal leading-tight">{product?.title}</h4>
                    {variant?.title !== 'Default Title' && <p className="text-xs text-gray-400 mt-0.5">{variant?.title}</p>}
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
              {/* Name */}
              <div>
                <label className="block font-semibold text-sm text-charcoal mb-1">Full Name *</label>
                <input type="text" placeholder="e.g. Sara Ahmed" value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className={'w-full px-4 py-3 rounded-2xl border-2 focus:outline-none text-sm ' + (errors.name ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-coral bg-cream')} />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block font-semibold text-sm text-charcoal mb-1">Email Address (optional)</label>
                <input type="email" placeholder="e.g. sara@gmail.com" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className={'w-full px-4 py-3 rounded-2xl border-2 focus:outline-none text-sm ' + (errors.email ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-coral bg-cream')} />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block font-semibold text-sm text-charcoal mb-1">Phone Number *</label>
                <div className="flex gap-2">
                  <div className="bg-cream border-2 border-gray-100 rounded-2xl px-3 flex items-center text-sm font-bold text-charcoal flex-shrink-0">🇵🇰 +92</div>
                  <input type="tel" placeholder="3360677340" value={form.phone}
                    onChange={e => setForm({...form, phone: formatPhone(e.target.value)})} maxLength={10}
                    className={'flex-1 px-4 py-3 rounded-2xl border-2 focus:outline-none text-sm ' + (errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-coral bg-cream')} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Enter 10 digits without 0 (e.g. 3360677340)</p>
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block font-semibold text-sm text-charcoal mb-2">WhatsApp Number *</label>
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input type="checkbox" checked={form.sameAsPhone}
                    onChange={e => setForm({...form, sameAsPhone: e.target.checked, whatsapp: ''})}
                    className="w-4 h-4 accent-coral" />
                  <span className="text-sm text-gray-600">Same as phone number</span>
                </label>
                {!form.sameAsPhone && (
                  <div>
                    <div className="flex gap-2">
                      <div className="bg-cream border-2 border-gray-100 rounded-2xl px-3 flex items-center text-sm font-bold text-charcoal flex-shrink-0">🇵🇰 +92</div>
                      <input type="tel" placeholder="3360677340" value={form.whatsapp}
                        onChange={e => setForm({...form, whatsapp: formatPhone(e.target.value)})} maxLength={10}
                        className={'flex-1 px-4 py-3 rounded-2xl border-2 focus:outline-none text-sm ' + (errors.whatsapp ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-coral bg-cream')} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Enter 10 digits without 0</p>
                    {errors.whatsapp && <p className="text-red-400 text-xs mt-1">{errors.whatsapp}</p>}
                  </div>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block font-semibold text-sm text-charcoal mb-1">City / Town *</label>
                <select value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                  className={'w-full px-4 py-3 rounded-2xl border-2 focus:outline-none text-sm ' + (errors.city ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-coral bg-cream')}>
                  <option value="">Select your city or town</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="block font-semibold text-sm text-charcoal mb-1">Delivery Address *</label>
                <textarea placeholder="House #, Street, Area, Landmark..." value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})} rows={2}
                  className={'w-full px-4 py-3 rounded-2xl border-2 focus:outline-none text-sm resize-none ' + (errors.address ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-coral bg-cream')} />
                {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
              </div>

              {/* COD */}
              <div className="bg-coral/10 border-2 border-coral rounded-2xl p-4 flex items-center gap-3">
                <div className="text-3xl">💵</div>
                <div>
                  <p className="font-display text-base text-charcoal">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">Pay when your order arrives</p>
                </div>
                <span className="ml-auto text-coral font-bold text-xs">✓ Selected</span>
              </div>

              {/* Rewards */}
              <RewardsSection onRewardsChange={setRewards} />

              {/* Coupon */}
              <div>
                <label className="block font-semibold text-sm text-charcoal mb-1">Discount Code (optional)</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Enter coupon code" value={coupon}
                    onChange={e => { setCoupon(e.target.value.toUpperCase()); setDiscount(null); setCouponError('') }}
                    className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm font-bold tracking-wider" />
                  <button type="button" onClick={applyCoupon} disabled={couponLoading || !coupon.trim()}
                    className="px-5 py-3 rounded-2xl bg-charcoal text-white text-sm font-bold hover:bg-coral transition-colors disabled:opacity-50">
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-red-400 text-xs mt-1">{couponError}</p>}
                {discount && (
                  <div className="flex items-center gap-2 mt-2 bg-mint/20 rounded-xl px-3 py-2">
                    <span className="text-green-600 font-bold text-xs">✓ {discount.label} applied!</span>
                    <button type="button" onClick={() => { setDiscount(null); setCoupon('') }}
                      className="ml-auto text-gray-400 hover:text-coral text-xs">✕ Remove</button>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-sm text-charcoal mb-1">Order Notes (optional)</label>
                <input type="text" placeholder="Any special instructions..." value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
              </div>

              {/* Total */}
              <div className="bg-cream rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">PKR {price.toLocaleString()}</span>
                </div>
                {discount && discount.type !== 'shipping' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-semibold">Discount ({discount.code})</span>
                    <span className="text-green-600 font-semibold">- PKR {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {rewardsDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-semibold">⭐ Rewards Discount</span>
                    <span className="text-green-600 font-semibold">- PKR {rewardsDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  {discount?.type === 'shipping'
                    ? <div className="flex gap-2"><span className="line-through text-gray-400">PKR 250</span><span className="text-green-600 font-semibold">FREE</span></div>
                    : <span className="font-semibold">PKR 250</span>
                  }
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="font-display text-base text-charcoal">Total</span>
                  <span className="font-display text-lg text-coral">PKR {total.toLocaleString()}</span>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-coral text-white font-display text-lg py-4 rounded-2xl hover:bg-opacity-90 transition-all hover:scale-[1.02] active:scale-95 shadow-md disabled:opacity-70">
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
              <p className="text-center text-xs text-gray-400">Your order will be confirmed shortly</p>
            </form>
          </div>
        )}

        {/* Step 2 - Success */}
        {step === 2 && (
          <div className="px-6 py-10 text-center">
            <div className="text-7xl mb-4">🎉</div>
            <h3 className="font-display text-3xl text-charcoal mb-2">Order Confirmed!</h3>
            <p className="text-gray-500 mb-6">Thank you! Your order has been placed successfully.</p>

            {/* Points earned notification */}
            {earnedPoints > 0 && (
              <div className="bg-sunny/30 rounded-2xl p-4 mb-4 text-left">
                <p className="font-display text-base text-charcoal">⭐ You earned {earnedPoints} points!</p>
                <p className="text-xs text-gray-500 mt-1">Keep shopping to earn more rewards.</p>
              </div>
            )}

            {/* Bonus notification */}
            {bonusAwarded && (
              <div className="bg-mint/20 rounded-2xl p-4 mb-4 text-left border-2 border-mint">
                <p className="font-display text-base text-charcoal">🎁 Bonus 100 Points!</p>
                <p className="text-xs text-gray-500 mt-1">You hit 500 points! Kiddy Trends added 100 bonus points to your account!</p>
              </div>
            )}

            <div className="bg-cream rounded-2xl p-5 text-left mb-6 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Name</span><span className="font-semibold">{form.name}</span></div>
              {form.email && <div className="flex justify-between text-sm"><span className="text-gray-500">Email</span><span className="font-semibold">{form.email}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-gray-500">Phone</span><span className="font-semibold">+92{form.phone}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">City</span><span className="font-semibold">{form.city}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Payment</span><span className="font-semibold">Cash on Delivery</span></div>
              {rewards.userId && <div className="flex justify-between text-sm"><span className="text-gray-500">Rewards ID</span><span className="font-semibold text-coral">{rewards.userId}</span></div>}
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="font-display text-base text-charcoal">Total</span>
                <span className="font-display text-lg text-coral">PKR {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-skyblue/20 rounded-2xl p-4 mb-6">
              <p className="text-2xl mb-1">📦</p>
              <p className="font-display text-base text-charcoal">Expected Delivery: 3-5 days</p>
              <p className="text-xs text-gray-500 mt-1">Our team will contact you on <strong>+92{form.phone}</strong> to confirm delivery</p>
            </div>

            <button onClick={onClose} className="w-full bg-coral text-white font-display text-base py-3 rounded-2xl hover:bg-opacity-90 transition-colors">
              Continue Shopping 🛍️
            </button>
          </div>
        )}
      </div>
    </div>
  )
}