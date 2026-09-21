'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EmployeePortalNav from '@/components/EmployeePortalNav'

const EMPTY_FORM = {
    customerName: '', customerPhone: '', cityName: '', deliveryAddress: '',
    orderDetail: '', items: '1', invoicePayment: '', transactionNotes: '',
}

export default function EmployeeInstagramOrdersPage() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()

    const [cities, setCities] = useState([])
    const [orders, setOrders] = useState([])
    const [loadingOrders, setLoadingOrders] = useState(true)

    const [form, setForm] = useState(EMPTY_FORM)
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

    async function handleBook(e) {
        e.preventDefault()
        setBookError('')
        setLastBooked(null)

        if (!form.customerName || !form.customerPhone || !form.cityName || !form.deliveryAddress || !form.invoicePayment) {
            setBookError('Customer name, phone, city, address and COD amount are all required.')
            return
        }
        if (!window.confirm('Book this order with PostEx now? A real shipment will be created.')) return

        setBooking(true)
        try {
            const res = await fetch('/api/admin/instagram-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'Booking failed')

            setLastBooked(data.order || { tracking_number: data.trackingNumber })
            setForm(EMPTY_FORM)
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

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/employee/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Instagram Orders</h1>
                </div>
                <p className="text-xs text-gray-400">Type in what the customer sent on Instagram — books directly with PostEx</p>
            </div>
            <EmployeePortalNav />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                <form onSubmit={handleBook} className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-4">Quick order entry</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Customer Name *</label>
                            <input value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                                   className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Phone *</label>
                            <input value={form.customerPhone} onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                                   placeholder="03xxxxxxxxx" className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">City *</label>
                            <input list="postex-cities" value={form.cityName} onChange={(e) => setForm((f) => ({ ...f, cityName: e.target.value }))}
                                   className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                            <datalist id="postex-cities">
                                {cities.map((c) => <option key={c.operationalCityName} value={c.operationalCityName} />)}
                            </datalist>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-3">
                            <label className="text-xs text-gray-500 mb-1 block">Delivery Address *</label>
                            <textarea value={form.deliveryAddress} onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
                                      rows={2} className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs text-gray-500 mb-1 block">Order Detail</label>
                            <input value={form.orderDetail} onChange={(e) => setForm((f) => ({ ...f, orderDetail: e.target.value }))}
                                   placeholder="e.g. Pink Frock 2-3Y x1, Blue Shorts 3-4Y x1"
                                   className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Pieces</label>
                            <input type="number" min="1" value={form.items} onChange={(e) => setForm((f) => ({ ...f, items: e.target.value }))}
                                   className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">COD Amount (PKR) *</label>
                            <input type="number" min="0" value={form.invoicePayment} onChange={(e) => setForm((f) => ({ ...f, invoicePayment: e.target.value }))}
                                   className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Notes (optional)</label>
                            <input value={form.transactionNotes} onChange={(e) => setForm((f) => ({ ...f, transactionNotes: e.target.value }))}
                                   className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
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
