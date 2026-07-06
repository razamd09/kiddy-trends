'use client'
import { useEffect, useState } from 'react'
import emailjs from '@emailjs/browser'
import RewardsSection from './RewardsSection'

const EMAILJS_SERVICE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_9p08wct'
const EMAILJS_TEMPLATE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_gyanmsp'
const EMAILJS_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'G3OmrUP2PwOat-o1W'
const ORDER_NOTIFICATION_EMAIL =
  process.env.NEXT_PUBLIC_ORDER_NOTIFICATION_EMAIL || 'thekiddytrends@gmail.com'
const SPIN_STORAGE_KEY = 'kt_spin_wheel_state'
const GIFT_FLASH_SEEN_KEY = 'kt_checkout_reward_flash_seen'

function notifySpinWheelStateChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('kt-spin-wheel-updated'))
  }
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function computeShippingAmount(subtotal, rate) {
  const flatPrice = Math.max(0, toNumber(rate?.flat_price ?? 250))
  const shippingPercentage = Math.max(0, toNumber(rate?.shipping_percentage ?? 0))
  const calculated = flatPrice + (toNumber(subtotal) * shippingPercentage) / 100
  return Math.max(0, Math.round(calculated))
}

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
  const [phoneLookupLoading, setPhoneLookupLoading] = useState(false)
  const [lastLookupPhone, setLastLookupPhone] = useState('')
  const [autoFilledMessage, setAutoFilledMessage] = useState('')
  const [form, setForm]               = useState({
    name:'', phone:'', whatsapp:'', sameAsPhone: true, email:'', address:'', city:'', notes:''
  })
  const [errors, setErrors]           = useState({})
  const [discount, setDiscount]       = useState(null)
  const [discountCode, setDiscountCode] = useState('')
  const [discountCodeLoading, setDiscountCodeLoading] = useState(false)
  const [discountCodeError, setDiscountCodeError] = useState('')
  const [rewards, setRewards]         = useState({ userId: '', points: 0, redeemed: 0 })
  const [showGiftFlash, setShowGiftFlash] = useState(false)
  const [shippingRate, setShippingRate] = useState({
    flat_price: 250,
    shipping_percentage: 0,
  })

  const price          = isCart ? cartTotal : parseFloat(variant?.price || 0)
  const comparePrice   = parseFloat(variant?.compare_at_price || 0)
  const isOnSale       = !isCart && comparePrice > price
  const image          = product?.images?.[0]?.src
  const baseShipping   = computeShippingAmount(price, shippingRate)
  const shipping       = discount?.type === 'shipping' ? 0 : baseShipping
  const discountAmount = discount
    ? discount.type === 'percent' ? Math.round(price * discount.value / 100)
    : discount.type === 'fixed'   ? Math.min(discount.value, price)
    : discount.discount_type === 'percentage' ? Math.round(price * discount.discount_value / 100)
    : discount.discount_type === 'amount' ? Math.min(discount.discount_value, price)
    : 0 : 0
  const rewardsDiscount = rewards.redeemed || 0
  const total = price + shipping - (discount?.type !== 'shipping' ? discountAmount : 0) - rewardsDiscount

  useEffect(() => {
    if (discount) return
    try {
      const raw = localStorage.getItem(SPIN_STORAGE_KEY)
      if (!raw) return
      const state = JSON.parse(raw)
      const now = Date.now()
      const amount = Number(state?.activeDiscount || 0)
      const consumed = Boolean(state?.consumed)
      const lockedUntil = Number(state?.lockedUntil || 0)

      if (amount > 0 && !consumed && lockedUntil > now) {
        setDiscount({
          type: 'fixed',
          value: Math.min(100, amount),
          code: state?.discountCode || ('SPIN' + amount),
        })
      }
    } catch {}
  }, [discount])

  useEffect(() => {
    let mounted = true

    async function fetchShippingRate() {
      try {
        const res = await fetch('/api/shipping-rates', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!mounted || !data?.rate) return
        setShippingRate({
          flat_price: toNumber(data.rate.flat_price),
          shipping_percentage: toNumber(data.rate.shipping_percentage),
        })
      } catch {}
    }

    fetchShippingRate()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    try {
      const seen = localStorage.getItem(GIFT_FLASH_SEEN_KEY) === '1'
      if (!seen) {
        setShowGiftFlash(true)
      }
    } catch {}
  }, [])

  function consumeSpinDiscountIfUsed() {
    if (!discount?.code || !String(discount.code).startsWith('SPIN')) return
    try {
      const raw = localStorage.getItem(SPIN_STORAGE_KEY)
      if (!raw) return
      const state = JSON.parse(raw)
      localStorage.setItem(SPIN_STORAGE_KEY, JSON.stringify({
        ...state,
        consumed: true,
        activeDiscount: 0,
      }))
      notifySpinWheelStateChange()
    } catch {}
  }

  function formatPhone(val) {
    let digits = String(val || '').replace(/\D/g, '')
    if (digits.startsWith('92') && digits.length > 10) digits = digits.slice(2)
    if (digits.startsWith('0') && digits.length > 10) digits = digits.slice(1)
    return digits.slice(0, 10)
  }
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

  async function lookupCustomerByPhone(phoneDigits) {
    if (phoneDigits.length !== 10 || phoneDigits === lastLookupPhone) return
    setPhoneLookupLoading(true)
    setAutoFilledMessage('')
    try {
      const res = await fetch('/api/checkout?phone=' + phoneDigits, { cache: 'no-store' })
      const data = await res.json()
      if (data?.exists && data?.customer) {
        const c = data.customer
        const customerPhone = formatPhone(c.phone || phoneDigits)
        const customerWhatsapp = formatPhone(c.whatsapp || customerPhone)
        const sameAsPhone = !customerWhatsapp || customerWhatsapp === customerPhone
        setForm(prev => ({
          ...prev,
          phone: customerPhone,
          name: c.name || prev.name,
          email: c.email || prev.email,
          address: c.address || prev.address,
          city: c.city || prev.city,
          sameAsPhone,
          whatsapp: sameAsPhone ? '' : customerWhatsapp,
        }))
        if (data?.rewards?.user_id) {
          setRewards(prev => ({ ...prev, userId: data.rewards.user_id, points: Number(data.rewards.points || 0), redeemed: 0 }))
          setAutoFilledMessage('Existing customer found. Details and rewards linked.')
        } else {
          setAutoFilledMessage('Existing customer found. Details auto-filled.')
        }
      }
      setLastLookupPhone(phoneDigits)
    } catch {}
    setPhoneLookupLoading(false)
  }

  function handlePhoneInputChange(val) {
    const digits = formatPhone(val)
    if (digits !== form.phone) setAutoFilledMessage('')
    setForm(prev => ({ ...prev, phone: digits }))
    if (digits.length === 10) {
      lookupCustomerByPhone(digits)
    }
  }

  async function applyDiscountCode() {
    if (!discountCode.trim()) {
      setDiscountCodeError('Please enter a discount code')
      return
    }
    setDiscountCodeLoading(true)
    setDiscountCodeError('')
    try {
      const res = await fetch('/api/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim() })
      })
      const data = await res.json()
      if (!res.ok) {
        setDiscountCodeError(data.error || 'Invalid discount code')
        return
      }
      setDiscount({
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        type: 'database'
      })
      setDiscountCode('')
      setDiscountCodeError('')
    } catch (err) {
      setDiscountCodeError('Error validating code. Please try again.')
    }
    setDiscountCodeLoading(false)
  }

  function removeDiscountCode() {
    setDiscount(null)
    setDiscountCode('')
    setDiscountCodeError('')
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

  async function sendAdminOrderEmail(orderNumber, itemsForEmail) {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) return

    const orderItemsText = (itemsForEmail || [])
      .map((item, idx) => {
        const qty = item.quantity || 1
        const title = item.title || ('Variant ' + (item.variantId || 'N/A'))
        const lineTotal = Number(item.price || 0) * qty
        return (idx + 1) + '. ' + title + ' x' + qty + ' = PKR ' + lineTotal.toLocaleString()
      })
      .join('\n')

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: ORDER_NOTIFICATION_EMAIL,
        recipient_email: ORDER_NOTIFICATION_EMAIL,
        email: ORDER_NOTIFICATION_EMAIL,
        customer_email: ORDER_NOTIFICATION_EMAIL,
        buyer_email: form.email || '',
        to_name: 'Kiddy Trends Admin',
        from_name: 'Website Order Bot',
        reply_to: form.email || ORDER_NOTIFICATION_EMAIL,
        subject: 'New website order received - ' + orderNumber,
        customer_name: form.name || 'N/A',
        phone: '+92' + form.phone,
        address: form.address || '',
        city: form.city || '',
        order_number: orderNumber,
        order_items: orderItemsText,
        subtotal: 'PKR ' + Number(price || 0).toLocaleString(),
        shipping: 'PKR ' + Number(shipping || 0).toLocaleString(),
        discount: 'PKR ' + Number((discount?.type !== 'shipping' ? discountAmount : 0) + (rewards.redeemed || 0)).toLocaleString(),
        total: 'PKR ' + Number(total || 0).toLocaleString(),
        message: 'We have received an order from website.',
      },
      EMAILJS_PUBLIC_KEY
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const items    = isCart
        ? cartItems.map(i => ({
            variantId: i.variantId,
            quantity: i.quantity,
            price: Number(i.price || 0),
            title: i.title || '',
            variantTitle: i.variantTitle || '',
            image: i.image || '',
          }))
        : [{
            variantId: variant?.id,
            quantity: 1,
            price: Number(variant?.price || 0),
            title: product?.title || '',
            variantTitle: variant?.title !== 'Default Title' ? (variant?.title || '') : '',
            image: image || '',
          }]
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
            discount: discount?.type !== 'shipping' ? discountAmount : 0,
            order_subtotal: Number(price || 0),
            order_shipping: Number(shipping || 0),
            order_total: Number(total || 0),
            rewards: rewards.userId ? { userId: rewards.userId, redeem: rewards.redeemed || 0 } : null,
            payment:  'cod',
          }
        })
      })
      let data
      try {
        data = await res.json()
      } catch {
        throw new Error('Invalid response from checkout API')
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Checkout failed. Please try again.')
      }

      if (data.success) {
        consumeSpinDiscountIfUsed()
        const orderNumber = data.orderNumber || data.orderName || ('#' + data.orderId)
        try {
          await Promise.race([
            sendAdminOrderEmail(orderNumber, items),
            new Promise((resolve) => setTimeout(resolve, 2500)),
          ])
        } catch {}

        const rewardsData = data.rewards || {}
        const params = new URLSearchParams({
          order: orderNumber,
          name:  form.name,
          total: String(Number(data.total ?? total)),
          points: String(Number(rewardsData.availablePoints || 0)),
          earned: String(Number(rewardsData.earnedPoints || 0)),
          redeemed: String(Number(rewardsData.redeemedPoints || 0)),
        })

        window.location.href = '/order-confirmation?' + params.toString()
        return
      }
    } catch (err) {
      setLoading(false)
      alert(err?.message || 'Something went wrong. Please try again.')
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
            {showGiftFlash && (
              <div className="mb-5 rounded-2xl border-2 border-sunny bg-yellow-50 p-4 relative overflow-hidden">
                <div className="absolute -right-5 -top-5 text-6xl opacity-20">🥚</div>
                <p className="font-display text-lg text-charcoal">🎁 Free Reward Offer</p>
                <p className="text-sm text-gray-700 mt-1">
                  Order above <strong>PKR 5,000</strong> and get a <strong>FREE Kinder Lego Egg</strong>.
                </p>
                <p className={'text-xs mt-2 font-semibold ' + (Number(price || 0) >= 5000 ? 'text-green-600' : 'text-coral')}>
                  {Number(price || 0) >= 5000
                    ? '✅ Great! Your current subtotal qualifies for the free gift.'
                    : ('Add PKR ' + Math.max(0, 5000 - Number(price || 0)).toLocaleString() + ' more to qualify.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowGiftFlash(false)
                    try { localStorage.setItem(GIFT_FLASH_SEEN_KEY, '1') } catch {}
                  }}
                  className="mt-3 w-full bg-charcoal text-white font-display text-sm py-2.5 rounded-xl hover:bg-coral transition-colors"
                >
                  Continue to Checkout
                </button>
              </div>
            )}
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
                    <p className="text-xs text-gray-400 mt-1">+ PKR {shipping.toLocaleString()} shipping</p>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone */}
              <div>
                <label className="block font-semibold text-sm text-charcoal mb-1">Phone Number *</label>
                <div className="flex gap-2">
                  <div className="bg-cream border-2 border-gray-100 rounded-2xl px-3 flex items-center text-sm font-bold text-charcoal flex-shrink-0">🇵🇰 +92</div>
                  <input type="tel" placeholder="3360677340" value={form.phone}
                    onChange={e => handlePhoneInputChange(e.target.value)}
                    onBlur={e => lookupCustomerByPhone(formatPhone(e.target.value))}
                    maxLength={10}
                    className={'flex-1 px-4 py-3 rounded-2xl border-2 focus:outline-none text-sm ' + (errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-coral bg-cream')} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Enter 10 digits without 0 (e.g. 3360677340)</p>
                {phoneLookupLoading && <p className="text-xs text-gray-400 mt-1">Checking existing customer...</p>}
                {autoFilledMessage && <p className="text-xs text-green-600 mt-1">{autoFilledMessage}</p>}
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>

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

              {/* Discount Code */}
              {!discount ? (
                <div>
                  <label className="block font-semibold text-sm text-charcoal mb-2">Have a Discount Code? 🎟️</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. SUMMER20" 
                      value={discountCode}
                      onChange={e => {
                        setDiscountCode(e.target.value.toUpperCase())
                        setDiscountCodeError('')
                      }}
                      onKeyPress={e => e.key === 'Enter' && applyDiscountCode()}
                      disabled={discountCodeLoading}
                      className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm disabled:opacity-50"
                    />
                    <button 
                      type="button"
                      onClick={applyDiscountCode}
                      disabled={discountCodeLoading || !discountCode.trim()}
                      className="px-6 bg-coral text-white font-display py-3 rounded-2xl hover:bg-opacity-90 transition-all disabled:opacity-50"
                    >
                      {discountCodeLoading ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {discountCodeError && <p className="text-red-400 text-xs mt-2">{discountCodeError}</p>}
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-base text-green-700">✅ Discount Applied!</p>
                      <p className="text-sm text-green-600 mt-1">
                        Code: <span className="font-bold font-mono">{discount.code}</span>
                        {' '}
                        {discount.discount_type === 'percentage' 
                          ? `(${discount.discount_value}% OFF)` 
                          : `(PKR ${discount.discount_value} OFF)`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeDiscountCode}
                      className="text-green-600 hover:text-red-500 text-sm font-semibold transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Rewards */}
              <RewardsSection onRewardsChange={setRewards} />

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
                    ? <div className="flex gap-2"><span className="line-through text-gray-400">PKR {baseShipping.toLocaleString()}</span><span className="text-green-600 font-semibold">FREE</span></div>
                    : <span className="font-semibold">PKR {baseShipping.toLocaleString()}</span>
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