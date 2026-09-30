'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EmployeePortalNav from '@/components/EmployeePortalNav'

const EMPTY_QUICK_FORM = { customerName: '', address: '', phone: '', username: '', amount: '' }

// Backup list of major Pakistani cities, checked if the live PostEx city
// list doesn't yield a match (e.g. the PostEx API is briefly unreachable) —
// city detection shouldn't go blind just because that one call failed.
const FALLBACK_CITIES = [
    'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
    'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Sargodha',
    'Bahawalpur', 'Sukkur', 'Larkana', 'Sheikhupura', 'Jhang', 'Gujrat',
    'Kasur', 'Mardan', 'Mingora', 'Rahim Yar Khan', 'Sahiwal', 'Okara',
    'Wah Cantt', 'Dera Ghazi Khan', 'Mirpur Khas', 'Nawabshah', 'Chiniot',
    'Kotli', 'Kamoke', 'Hafizabad', 'Muzaffargarh', 'Khanpur', 'Gojra',
    'Mandi Bahauddin', 'Abbottabad', 'Turbat', 'Muridke', 'Jacobabad',
    'Shikarpur', 'Jhelum', 'Khanewal', 'Dera Ismail Khan', 'Chakwal',
    'Kohat', 'Vehari', 'Nowshera', 'Mianwali', 'Attock', 'Toba Tek Singh',
]

// Finds which operational city the pasted address mentions — e.g.
// "417 AA canal garden Lahore" matches "Lahore" — so staff never have to
// pick it manually for the common case. Tries the live PostEx list first
// (so the exact name PostEx expects is used), then falls back to a
// hardcoded list of major cities if that doesn't match anything. Matches
// with spaces collapsed too (both sides), since multi-word city names like
// "Tando Adam" often get pasted with no space ("Tandoadam") and a plain
// substring check would otherwise miss them.
function stripSpaces(value) {
    return value.toLowerCase().replace(/\s+/g, '')
}

function includesCity(haystack, haystackNoSpaces, cityName) {
    const lowerCity = cityName.toLowerCase()
    return haystack.includes(lowerCity) || haystackNoSpaces.includes(stripSpaces(cityName))
}

function detectCity(address, cities) {
    const lower = address.toLowerCase()
    const lowerNoSpaces = stripSpaces(address)

    const liveMatch = cities.find((c) => includesCity(lower, lowerNoSpaces, String(c.operationalCityName || '')))
    if (liveMatch) return liveMatch.operationalCityName

    const fallbackMatch = FALLBACK_CITIES.find((name) => includesCity(lower, lowerNoSpaces, name))
    return fallbackMatch || ''
}

// Staff often paste the whole block from Instagram (address + phone number
// together) into the address box — pull a Pakistani mobile number out of
// that text too, same idea as city detection.
function detectPhone(text) {
    const candidates = text.match(/[\d][\d\s-]{8,13}[\d]/g) || []
    for (const candidate of candidates) {
        const digits = candidate.replace(/\D/g, '')
        if (digits.length === 11 && digits.startsWith('0')) return digits
        if (digits.length === 10 && digits.startsWith('3')) return '0' + digits
        if (digits.length === 12 && digits.startsWith('92')) return '0' + digits.slice(2)
    }
    return ''
}

export default function EmployeeInstagramOrdersPage() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()

    const [cities, setCities] = useState([])
    const [orders, setOrders] = useState([])
    const [loadingOrders, setLoadingOrders] = useState(true)

    // 'social' = the original quick-entry flow (Instagram/Facebook/WhatsApp
    // DM orders, typed in by hand). 'website' = picks from real website
    // checkout orders sitting in "processing" and pre-fills the same form
    // from them instead.
    const [activeTab, setActiveTab] = useState('social')
    const [websiteOrders, setWebsiteOrders] = useState([])
    const [loadingWebsiteOrders, setLoadingWebsiteOrders] = useState(false)
    const [websiteOrdersLoaded, setWebsiteOrdersLoaded] = useState(false)
    const [sourceOrderId, setSourceOrderId] = useState(null)

    const [quick, setQuick] = useState(EMPTY_QUICK_FORM)
    const [detectedCity, setDetectedCity] = useState('')
    const [cityOverride, setCityOverride] = useState('')
    const [orderDetail, setOrderDetail] = useState('')
    const [orderType, setOrderType] = useState('Normal')
    const [returnCity, setReturnCity] = useState('')
    const [returnAddress, setReturnAddress] = useState('')

    const [booking, setBooking] = useState(false)
    const [bookError, setBookError] = useState('')
    const [lastBooked, setLastBooked] = useState(null)

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token') || ''
            if (!token) {
                const employee = localStorage.getItem('employee')
                if (!employee) { router.push('/admin'); return }
                setVerified(true)
                loadCities()
                loadOrders()
                return
            }
            try {
                const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await res.json()
                if (!data.valid) {
                    localStorage.removeItem('admin_token')
                    const employee = localStorage.getItem('employee')
                    if (!employee) { router.push('/admin'); return }
                }
                setVerified(true)
                loadCities()
                loadOrders()
            } catch {
                const employee = localStorage.getItem('employee')
                if (!employee) { router.push('/admin'); return }
                setVerified(true)
                loadCities()
                loadOrders()
            }
        }
        verify()
    }, [])

    useEffect(() => {
        if (verified && activeTab === 'website' && !websiteOrdersLoaded) loadWebsiteOrders()
    }, [verified, activeTab])

    async function loadCities() {
        try {
            const res = await fetch('/api/admin/instagram-orders/cities')
            const data = await res.json()
            if (data.success) setCities(data.cities || [])
        } catch {}
    }

    async function loadOrders() {
        setLoadingOrders(true)
        try {
            const res = await fetch('/api/admin/instagram-orders?limit=50')
            const data = await res.json()
            setOrders(data.success ? (data.orders || []) : [])
        } catch {
            setOrders([])
        }
        setLoadingOrders(false)
    }

    // Real website checkout orders sitting in "processing" — confirmed but
    // not yet handed to a courier. Lazy-loaded the first time the Website
    // Orders tab is opened, same as everything else on this page.
    async function loadWebsiteOrders() {
        setLoadingWebsiteOrders(true)
        try {
            const token = localStorage.getItem('admin_token') || ''
            const res = await fetch('/api/admin/orders?status=processing&page=1', { headers: { 'x-admin-token': token } })
            const data = await res.json()
            setWebsiteOrders(Array.isArray(data.orders) ? data.orders : [])
        } catch {
            setWebsiteOrders([])
        }
        setWebsiteOrdersLoaded(true)
        setLoadingWebsiteOrders(false)
    }

    function summarizeItems(items) {
        const list = Array.isArray(items) ? items : []
        if (list.length === 0) return ''
        const first = String(list[0]?.title || '').trim()
        return list.length > 1 ? first + ' + ' + (list.length - 1) + ' more' : first
    }

    // Pulls a website order's details straight into the same quick-entry
    // form the social-DM flow uses — the booking call to PostEx afterward
    // doesn't need to know or care which tab it came from.
    function selectWebsiteOrder(order) {
        const address = String(order.customer_address || '').trim()
        setQuick({
            customerName: order.customer_name || '',
            address,
            phone: order.customer_phone || '',
            username: '',
            amount: String(order.total || ''),
        })
        setOrderDetail(summarizeItems(order.items))
        setSourceOrderId(order.id)
        setBookError('')
        setLastBooked(null)

        // The stored customer_city is free-typed at checkout and may not
        // match PostEx's exact operational-city spelling — run the same
        // detection used for pasted addresses, seeded with the address
        // text plus whatever city the customer gave, and only fall back to
        // asking staff to pick manually if neither resolves.
        const combined = address + ' ' + String(order.customer_city || '')
        const detected = detectCity(combined, cities)
        setDetectedCity(detected)
        setCityOverride(detected ? '' : (cities.find((c) => String(c.operationalCityName || '').toLowerCase() === String(order.customer_city || '').toLowerCase())?.operationalCityName || ''))
    }

    function clearSourceOrder() {
        setSourceOrderId(null)
        setQuick(EMPTY_QUICK_FORM)
        setDetectedCity('')
        setCityOverride('')
        setOrderDetail('')
    }

    function updateQuick(field, value) {
        const next = { ...quick, [field]: value }
        if (field === 'address') {
            setDetectedCity(detectCity(value, cities))
            // Only auto-fill if the phone box is still empty — never
            // overwrite something staff already typed themselves.
            if (!quick.phone.trim()) {
                const detectedPhone = detectPhone(value)
                if (detectedPhone) next.phone = detectedPhone
            }
        }
        setQuick(next)
    }

    async function handleBook(e) {
        e.preventDefault()
        setBookError('')
        setLastBooked(null)

        const cityName = cityOverride || detectedCity
        const usernameRequired = !sourceOrderId
        if (!quick.customerName.trim() || !quick.address.trim() || !quick.phone.trim() || !quick.amount.trim() || (usernameRequired && !quick.username.trim())) {
            setBookError('Name, address, phone' + (usernameRequired ? ', Instagram username' : '') + ' and amount are all required.')
            return
        }
        if (!cityName) {
            setBookError("Couldn't detect a city from that address — pick one below.")
            return
        }
        if (orderType === 'Reversed' && (!returnCity.trim() || !returnAddress.trim())) {
            setBookError('Return city and return address are required for a Reversed order.')
            return
        }
        if (!window.confirm('Book this order with PostEx now? A real shipment will be created.')) return

        setBooking(true)
        try {
            const res = await fetch('/api/admin/instagram-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: quick.customerName,
                    customerPhone: quick.phone,
                    cityName,
                    deliveryAddress: quick.address,
                    orderDetail,
                    items: '1',
                    invoicePayment: quick.amount,
                    transactionNotes: sourceOrderId ? 'Website order' : 'IG: @' + quick.username.replace(/^@/, ''),
                    instagramUsername: quick.username.replace(/^@/, ''),
                    orderType,
                    returnCityName: orderType === 'Reversed' ? returnCity : undefined,
                    returnAddress: orderType === 'Reversed' ? returnAddress : undefined,
                    sourceOrderId: sourceOrderId || undefined,
                }),
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'Booking failed')

            setLastBooked(data.order || { tracking_number: data.trackingNumber })
            setQuick(EMPTY_QUICK_FORM)
            setDetectedCity('')
            setCityOverride('')
            setOrderDetail('')
            setOrderType('Normal')
            setReturnCity('')
            setReturnAddress('')
            if (sourceOrderId) {
                setSourceOrderId(null)
                setWebsiteOrders((prev) => prev.filter((o) => o.id !== sourceOrderId))
            }
            loadOrders()
        } catch (err) {
            setBookError(err.message)
        }
        setBooking(false)
    }

    async function handleCancel(order) {
        if (!window.confirm('Cancel order ' + order.tracking_number + ' with PostEx?')) return
        try {
            const res = await fetch('/api/admin/instagram-orders/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, trackingNumber: order.tracking_number }),
            })
            const data = await res.json()
            if (!data.success) { alert(data.error || 'Cancel failed'); return }
            loadOrders()
        } catch (err) {
            alert(err.message)
        }
    }

    function printLabel(trackingNumber) {
        window.open('/api/admin/instagram-orders/label?trackingNumbers=' + encodeURIComponent(trackingNumber), '_blank')
    }

    if (!verified) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
            </div>
        )
    }

    const effectiveCity = cityOverride || detectedCity

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/employee/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Post Ex Orders</h1>
                </div>
                <p className="text-xs text-gray-400">
                    {activeTab === 'website'
                        ? 'Pick a processing website order to book it with PostEx'
                        : 'Paste address, phone, username & amount from the chat — books straight to PostEx'}
                </p>
            </div>
            <EmployeePortalNav />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                <div className="flex gap-2">
                    <button type="button" onClick={() => setActiveTab('social')}
                            className={'px-5 py-2.5 rounded-full font-display text-sm transition-colors ' + (activeTab === 'social' ? 'bg-charcoal text-white' : 'bg-white text-charcoal border-2 border-gray-100 hover:border-coral/40')}>
                        Instagram/Facebook/WhatsApp Orders
                    </button>
                    <button type="button" onClick={() => setActiveTab('website')}
                            className={'px-5 py-2.5 rounded-full font-display text-sm transition-colors ' + (activeTab === 'website' ? 'bg-charcoal text-white' : 'bg-white text-charcoal border-2 border-gray-100 hover:border-coral/40')}>
                        Website Orders
                    </button>
                </div>

                <div className={activeTab === 'website' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start' : ''}>
                <div className={activeTab === 'website' ? '' : 'max-w-3xl mx-auto w-full space-y-6'}>

                <form onSubmit={handleBook} className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">Quick order entry</p>
                    <p className="text-xs text-gray-500 mb-4">
                        {sourceOrderId
                            ? 'Pre-filled from the selected website order — amount is editable if the parcel total needs adjusting.'
                            : 'Copy these straight from the Instagram chat — city fills in automatically from the address.'}
                    </p>

                    {sourceOrderId && (
                        <div className="bg-cream rounded-xl px-3 py-2 mb-4 flex items-center justify-between">
                            <p className="text-xs text-charcoal">Booking from website order <strong>#{sourceOrderId}</strong></p>
                            <button type="button" onClick={clearSourceOrder} className="text-xs text-gray-400 hover:text-coral">✕ Clear</button>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Order Type *</label>
                            <select value={orderType} onChange={(e) => setOrderType(e.target.value)}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                <option value="Normal">Normal</option>
                                <option value="Reversed">Reversed</option>
                                <option value="Replacement">Replacement</option>
                            </select>
                        </div>
                        {orderType === 'Reversed' && (
                            <>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Return City *</label>
                                    <select value={returnCity} onChange={(e) => setReturnCity(e.target.value)}
                                            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                        <option value="">Select city...</option>
                                        {cities.map((c) => <option key={c.operationalCityName} value={c.operationalCityName}>{c.operationalCityName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Return Address *</label>
                                    <textarea value={returnAddress} onChange={(e) => setReturnAddress(e.target.value)}
                                              placeholder="Where PostEx should deliver the returned item back to" rows={2}
                                              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                                </div>
                            </>
                        )}
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Customer Name *</label>
                            <input value={quick.customerName} onChange={(e) => updateQuick('customerName', e.target.value)}
                                   placeholder="e.g. Sehar Majid" className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Address *</label>
                            <textarea value={quick.address} onChange={(e) => updateQuick('address', e.target.value)}
                                      placeholder="e.g. 417 AA canal garden Lahore" rows={2}
                                      className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                            {quick.address.trim() && (
                                effectiveCity
                                    ? <p className="text-xs text-mint mt-1">✓ Detected city: <strong>{effectiveCity}</strong></p>
                                    : <p className="text-xs text-orange-500 mt-1">⚠ Couldn't detect a city — pick one below</p>
                            )}
                            {quick.address.trim() && !detectedCity && (
                                <select value={cityOverride} onChange={(e) => setCityOverride(e.target.value)}
                                        className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm mt-2">
                                    <option value="">Select city manually...</option>
                                    {cities.map((c) => <option key={c.operationalCityName} value={c.operationalCityName}>{c.operationalCityName}</option>)}
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Phone *</label>
                            <input value={quick.phone} onChange={(e) => updateQuick('phone', e.target.value)}
                                   placeholder="03191598004" className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        {!sourceOrderId && (
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Instagram Username *</label>
                                <input value={quick.username} onChange={(e) => updateQuick('username', e.target.value)}
                                       placeholder="seharmajid20" className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                            </div>
                        )}
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">COD Amount (PKR) * {sourceOrderId && <span className="text-gray-400 font-normal">(editable — adjust if the parcel total changed)</span>}</label>
                            <input type="number" min="0" value={quick.amount} onChange={(e) => updateQuick('amount', e.target.value)}
                                   placeholder="2000" className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">What they ordered (optional)</label>
                            <input value={orderDetail} onChange={(e) => setOrderDetail(e.target.value)}
                                   placeholder="e.g. Pink Frock 2-3Y" className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                    </div>

                    {bookError && <p className="text-sm text-red-500 mt-4">{bookError}</p>}

                    {lastBooked && (
                        <div className="mt-4 bg-mint/10 border border-mint/30 rounded-xl p-4 flex items-center justify-between">
                            <p className="text-sm text-charcoal">✓ Booked — tracking number <strong>{lastBooked.tracking_number}</strong></p>
                            <button type="button" onClick={() => printLabel(lastBooked.tracking_number)}
                                    className="px-4 py-2 bg-charcoal text-white text-xs font-display rounded-full hover:bg-opacity-90">
                                🖨 Print Label
                            </button>
                        </div>
                    )}

                    <button type="submit" disabled={booking}
                            className="mt-4 px-6 py-3 bg-coral text-white font-display text-sm rounded-full hover:bg-opacity-90 disabled:opacity-50">
                        {booking ? 'Booking with PostEx...' : '📦 Book Order'}
                    </button>
                </form>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-4">Recent orders</p>
                    {loadingOrders && <p className="text-sm text-gray-400">Loading...</p>}
                    {!loadingOrders && orders.length === 0 && <p className="text-sm text-gray-400">No orders booked yet.</p>}
                    {!loadingOrders && orders.length > 0 && (
                        <div className="space-y-2">
                            {orders.map((order) => (
                                <div key={order.id} className="flex items-center gap-3 border-2 border-gray-100 rounded-xl p-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-charcoal truncate">
                                            {order.customer_name} · {order.customer_phone} · {order.city_name}
                                            {order.order_type && order.order_type !== 'Normal' && (
                                                <span className="ml-2 text-[10px] font-semibold text-coral border border-coral/40 rounded-full px-2 py-0.5 align-middle">{order.order_type}</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">{order.order_detail || order.delivery_address}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-semibold text-charcoal">PKR {Number(order.invoice_payment).toLocaleString()}</p>
                                        <p className="text-xs text-gray-400">{order.order_status || '—'} {order.tracking_number ? '· ' + order.tracking_number : ''}</p>
                                    </div>
                                    {order.tracking_number && !order.cancelled_at && (
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button onClick={() => printLabel(order.tracking_number)}
                                                    className="text-xs text-coral hover:underline">Print</button>
                                            <button onClick={() => handleCancel(order)}
                                                    className="text-xs text-gray-300 hover:text-coral">Cancel</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                </div>

                {activeTab === 'website' && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <p className="font-display text-lg text-charcoal mb-1">Processing website orders</p>
                        <p className="text-xs text-gray-500 mb-4">Click one to fill in the form on the left.</p>

                        {loadingWebsiteOrders && <p className="text-sm text-gray-400">Loading...</p>}
                        {!loadingWebsiteOrders && websiteOrders.length === 0 && (
                            <p className="text-sm text-gray-400">No orders in "processing" right now.</p>
                        )}
                        {!loadingWebsiteOrders && websiteOrders.length > 0 && (
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {websiteOrders.map((order) => (
                                    <button key={order.id} type="button" onClick={() => selectWebsiteOrder(order)}
                                            className={'w-full text-left border-2 rounded-xl p-3 transition-colors ' + (sourceOrderId === order.id ? 'border-coral bg-coral/5' : 'border-gray-100 hover:border-coral/40')}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm text-charcoal truncate">{order.customer_name} · {order.customer_phone}</p>
                                                <p className="text-xs text-gray-400 truncate">{order.order_number} · {order.customer_city} · {summarizeItems(order.items)}</p>
                                            </div>
                                            <p className="text-sm font-semibold text-charcoal flex-shrink-0">PKR {Number(order.total || 0).toLocaleString()}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                </div>
            </div>
        </div>
    )
}
