'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPortalNav from '@/components/AdminPortalNav'

const EMPTY_QUICK_FORM = { address: '', phone: '', username: '', amount: '' }

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
// hardcoded list of major cities if that doesn't match anything.
function detectCity(address, cities) {
    const lower = address.toLowerCase()

    const liveMatch = cities.find((c) => lower.includes(String(c.operationalCityName || '').toLowerCase()))
    if (liveMatch) return liveMatch.operationalCityName

    const fallbackMatch = FALLBACK_CITIES.find((name) => lower.includes(name.toLowerCase()))
    return fallbackMatch || ''
}

export default function AdminInstagramOrdersPage() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()

    const [cities, setCities] = useState([])
    const [orders, setOrders] = useState([])
    const [loadingOrders, setLoadingOrders] = useState(true)

    const [quick, setQuick] = useState(EMPTY_QUICK_FORM)
    const [detectedCity, setDetectedCity] = useState('')
    const [cityOverride, setCityOverride] = useState('')
    const [orderDetail, setOrderDetail] = useState('')

    const [booking, setBooking] = useState(false)
    const [bookError, setBookError] = useState('')
    const [lastBooked, setLastBooked] = useState(null)

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
            try {
                const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await res.json()
                if (!data.valid) { localStorage.removeItem('admin_token'); router.push('/admin'); return }
                setVerified(true)
                loadCities()
                loadOrders()
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

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

    function updateQuick(field, value) {
        const next = { ...quick, [field]: value }
        setQuick(next)
        if (field === 'address') setDetectedCity(detectCity(value, cities))
    }

    async function handleBook(e) {
        e.preventDefault()
        setBookError('')
        setLastBooked(null)

        const cityName = cityOverride || detectedCity
        if (!quick.address.trim() || !quick.phone.trim() || !quick.username.trim() || !quick.amount.trim()) {
            setBookError('Address, phone, Instagram username and amount are all required.')
            return
        }
        if (!cityName) {
            setBookError("Couldn't detect a city from that address — pick one below.")
            return
        }
        if (!window.confirm('Book this order with PostEx now? A real shipment will be created.')) return

        setBooking(true)
        try {
            const res = await fetch('/api/admin/instagram-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: quick.username,
                    customerPhone: quick.phone,
                    cityName,
                    deliveryAddress: quick.address,
                    orderDetail,
                    items: '1',
                    invoicePayment: quick.amount,
                    transactionNotes: '',
                }),
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'Booking failed')

            setLastBooked(data.order || { tracking_number: data.trackingNumber })
            setQuick(EMPTY_QUICK_FORM)
            setDetectedCity('')
            setCityOverride('')
            setOrderDetail('')
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
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Instagram Orders</h1>
                </div>
                <p className="text-xs text-gray-400">Paste address, phone, username &amp; amount from the chat — books straight to PostEx</p>
            </div>
            <AdminPortalNav />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                <form onSubmit={handleBook} className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">Quick order entry</p>
                    <p className="text-xs text-gray-500 mb-4">Copy these four things straight from the Instagram chat — city fills in automatically from the address.</p>

                    <div className="space-y-4">
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
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Instagram Username *</label>
                            <input value={quick.username} onChange={(e) => updateQuick('username', e.target.value)}
                                   placeholder="seharmajid20" className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">COD Amount (PKR) *</label>
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
                                        <p className="text-sm text-charcoal truncate">{order.customer_name} · {order.customer_phone} · {order.city_name}</p>
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
        </div>
    )
}
