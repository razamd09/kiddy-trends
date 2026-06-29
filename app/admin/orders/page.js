'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const statusConfig = {
    pending:    { color: 'bg-orange-100 text-orange-600 border-orange-200', icon: '⏳', label: 'Pending' },
    processing: { color: 'bg-blue-100 text-blue-600 border-blue-200',       icon: '⚙️', label: 'Processing' },
    dispatched: { color: 'bg-purple-100 text-purple-600 border-purple-200', icon: '🚚', label: 'Dispatched' },
    delivered:  { color: 'bg-green-100 text-green-600 border-green-200',    icon: '✅', label: 'Delivered' },
    cancelled:  { color: 'bg-red-100 text-red-500 border-red-200',          icon: '❌', label: 'Cancelled' },
}

const allStatuses = ['pending', 'processing', 'dispatched', 'delivered', 'cancelled']

function playSound() {
    try {
        const ctx  = new (window.AudioContext || window.webkitAudioContext)()
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1)
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.5)
    } catch {}
}

export default function AdminOrders() {
    const [orders, setOrders]               = useState([])
    const [loading, setLoading]             = useState(true)
    const [verified, setVerified]           = useState(false)
    const [filter, setFilter]               = useState('all')
    const [page, setPage]                   = useState(1)
    const [total, setTotal]                 = useState(0)
    const [selected, setSelected]           = useState(null)
    const [updating, setUpdating]           = useState(false)
    const [lastOrderCount, setLastOrderCount] = useState(0)
    const [trackingInput, setTrackingInput] = useState('')
    const router = useRouter()

    // Verify session
    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
            try {
                const res  = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await res.json()
                if (!data.valid) {
                    localStorage.removeItem('admin_token')
                    router.push('/admin')
                } else {
                    setVerified(true)
                }
            } catch { router.push('/admin') }
        }
        verify()
    }, [])

    // Fetch orders when verified
    useEffect(() => {
        if (verified) fetchOrders()
    }, [verified, filter, page])

    // Sound alert — check for new orders every 30s
    useEffect(() => {
        if (!verified) return
        const interval = setInterval(async () => {
            const token = localStorage.getItem('admin_token')
            const res   = await fetch('/api/admin/orders?page=1&status=pending', {
                headers: { 'x-admin-token': token }
            })
            const data  = await res.json()
            const count = data.total || 0
            if (lastOrderCount > 0 && count > lastOrderCount) {
                playSound()
                if (Notification.permission === 'granted') {
                    new Notification('🛍️ New Order!', {
                        body: 'You have a new pending order on Kiddy Trends',
                        icon: '/logo.jpg'
                    })
                }
                fetchOrders()
            }
            setLastOrderCount(count)
        }, 30000)
        return () => clearInterval(interval)
    }, [verified, lastOrderCount])

    // Request notification permission
    useEffect(() => {
        if (verified && typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [verified])

    useEffect(() => {
        if (!selected) {
            setTrackingInput('')
            return
        }
        const fromFields =
            selected.tracking_number ||
            selected.awb_number ||
            selected.awb ||
            selected.consignment_number ||
            ''
        const notesMatch = String(selected.notes || '').match(/\[PostEx\][^\n\r]*AWB:\s*([A-Za-z0-9-]+)/i)
        setTrackingInput(String(fromFields || notesMatch?.[1] || ''))
    }, [selected?.id])

    async function fetchOrders() {
        setLoading(true)
        const token = localStorage.getItem('admin_token')
        const res   = await fetch('/api/admin/orders?page=' + page + '&status=' + filter, {
            headers: { 'x-admin-token': token }
        })
        const data = await res.json()
        setOrders(data.orders || [])
        setTotal(data.total || 0)
        setLoading(false)
    }

    async function updateStatus(id, status) {
        setUpdating(true)
        const token = localStorage.getItem('admin_token')
        const res   = await fetch('/api/admin/orders', {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
            body:    JSON.stringify({ id, status })
        })
        const data = await res.json()
        if (data.success) {
            setSelected(prev => prev ? { ...prev, status } : null)
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
        }
        setUpdating(false)
    }

    async function saveTracking() {
        if (!selected) return
        setUpdating(true)
        const token = localStorage.getItem('admin_token')
        const cleanTracking = trackingInput.trim()
        const baseNotes = String(selected.notes || '').replace(/\s*\[PostEx\][^\n\r]*/gi, '').trim()
        const nextNotes = cleanTracking
            ? (baseNotes ? (baseNotes + ' | ') : '') + '[PostEx] AWB: ' + cleanTracking
            : baseNotes

        const res = await fetch('/api/admin/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
            body: JSON.stringify({ id: selected.id, notes: nextNotes }),
        })
        const data = await res.json()
        if (data.success) {
            setSelected(data.order)
            setOrders(prev => prev.map(o => o.id === selected.id ? data.order : o))
        }
        setUpdating(false)
    }

    function getItems(order) {
        try {
            return typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])
        } catch { return [] }
    }

    function buildWhatsAppMsg(order) {
        const items    = getItems(order)
        const itemText = items.map(i => '• ' + i.title + ' x' + i.quantity).join('\n')
        const msg =
            'Assalam o Alaikum ' + order.customer_name + '! 👋\n\n' +
            'Your order from Kiddy Trends has been confirmed! 🎉\n\n' +
            (itemText ? 'Items:\n' + itemText + '\n\n' : '') +
            'Total: PKR ' + (order.total || 0).toLocaleString() + '\n' +
            'Payment: Cash on Delivery\n\n' +
            'Delivery to: ' + order.customer_address + ', ' + order.customer_city + '\n\n' +
            'Expected delivery: 3-5 business days.\n\n' +
            'Thank you for shopping with Kiddy Trends! 🛍️\nwww.thekiddytrends.com'
        const phone = (order.customer_whatsapp || order.customer_phone || '').replace(/\D/g, '')
        return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg)
    }

    function logout() {
        localStorage.removeItem('admin_token')
        router.push('/admin')
    }

    if (!verified) return (
        <div className="min-h-screen bg-cream flex items-center justify-center">
            <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-cream">
            {/* Header */}
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Orders</h1>
                    <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{total}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchOrders}
                            className="text-xs bg-cream px-3 py-1.5 rounded-full text-gray-500 hover:text-coral">
                        🔄 Refresh
                    </button>
                    <button onClick={playSound}
                            className="text-xs bg-cream px-3 py-1.5 rounded-full text-gray-500 hover:text-coral">
                        🔔 Test Sound
                    </button>
                    <button onClick={logout} className="text-xs text-gray-400 hover:text-coral">
                        Logout →
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Filter tabs */}
                <div className="flex gap-2 flex-wrap mb-6">
                    {['all', ...allStatuses].map(s => (
                        <button key={s} onClick={() => { setFilter(s); setPage(1) }}
                                className={'px-4 py-2 rounded-full text-sm font-semibold transition-all ' +
                                    (filter === s ? 'bg-coral text-white shadow-md' : 'bg-white text-charcoal border-2 border-gray-100 hover:border-coral')}>
                            {s === 'all' ? '🛍️ All (' + total + ')' : (statusConfig[s]?.icon + ' ' + statusConfig[s]?.label)}
                        </button>
                    ))}
                </div>

                <div className="grid md:grid-cols-5 gap-4">

                    {/* Orders list */}
                    <div className="md:col-span-2 space-y-3 max-h-[80vh] overflow-y-auto pr-1">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-24" />
                            ))
                        ) : orders.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 bg-white rounded-2xl">
                                <p className="text-4xl mb-2">📭</p>
                                <p>No orders found</p>
                            </div>
                        ) : orders.map(order => (
                            <div key={order.id} onClick={() => setSelected(order)}
                                 className={'bg-white rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all border-2 ' +
                                     (selected?.id === order.id ? 'border-coral' : 'border-transparent')}>
                                <div className="flex items-start justify-between mb-1">
                                    <div>
                                        <p className="font-display text-base text-charcoal">{order.customer_name}</p>
                                        {order.order_number && <p className="text-xs text-coral font-bold">{order.order_number}</p>}
                                    </div>
                                    <span className={'text-xs px-2 py-1 rounded-full font-bold border ' +
                                        (statusConfig[order.status]?.color || 'bg-gray-100 text-gray-500 border-gray-200')}>
                    {statusConfig[order.status]?.icon} {statusConfig[order.status]?.label}
                  </span>
                                </div>
                                <p className="text-xs text-gray-400 mb-1">{order.customer_city} · {order.customer_phone}</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-300">{new Date(order.created_at).toLocaleString('en-PK')}</p>
                                    <p className="font-bold text-coral text-sm">PKR {(order.total || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}

                        {total > 20 && (
                            <div className="flex justify-center gap-2 mt-4">
                                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                                        className="px-4 py-2 bg-white rounded-xl text-sm disabled:opacity-50 border border-gray-100">← Prev</button>
                                <span className="px-4 py-2 bg-coral text-white rounded-xl text-sm font-bold">Page {page}</span>
                                <button onClick={() => setPage(p => p+1)} disabled={page * 20 >= total}
                                        className="px-4 py-2 bg-white rounded-xl text-sm disabled:opacity-50 border border-gray-100">Next →</button>
                            </div>
                        )}
                    </div>

                    {/* Order detail */}
                    <div className="md:col-span-3">
                        {!selected ? (
                            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 flex items-center justify-center min-h-[400px]">
                                <div>
                                    <p className="text-5xl mb-3">👈</p>
                                    <p>Select an order to view details</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl p-6 space-y-4">

                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-display text-xl text-charcoal">
                                            {selected.order_number || 'Order #' + selected.id}
                                        </p>
                                        <p className="text-xs text-gray-400">{new Date(selected.created_at).toLocaleString('en-PK')}</p>
                                    </div>
                                    <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-coral text-xl">✕</button>
                                </div>

                                {/* Customer */}
                                <div className="bg-cream rounded-2xl p-4">
                                    <p className="font-display text-sm text-charcoal mb-3">👤 Customer Info</p>
                                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                                        <div><span className="text-gray-400 text-xs">Name</span><br/><span className="font-semibold">{selected.customer_name}</span></div>
                                        <div><span className="text-gray-400 text-xs">City</span><br/><span className="font-semibold">{selected.customer_city}</span></div>
                                        <div><span className="text-gray-400 text-xs">Phone</span><br/><span className="font-semibold">{selected.customer_phone}</span></div>
                                        <div><span className="text-gray-400 text-xs">WhatsApp</span><br/><span className="font-semibold">{selected.customer_whatsapp}</span></div>
                                        {selected.customer_email && (
                                            <div className="col-span-2"><span className="text-gray-400 text-xs">Email</span><br/><span className="font-semibold">{selected.customer_email}</span></div>
                                        )}
                                        <div className="col-span-2"><span className="text-gray-400 text-xs">Address</span><br/><span className="font-semibold">{selected.customer_address}</span></div>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="bg-cream rounded-2xl p-4">
                                    <p className="font-display text-sm text-charcoal mb-3">📦 Items</p>
                                    <div className="space-y-2">
                                        {getItems(selected).length === 0 ? (
                                            <p className="text-xs text-gray-400">No item details available</p>
                                        ) : getItems(selected).map((item, i) => {
                                            return (
                                            <a key={i} href={item.handle ? `/products/${item.handle}` : '#'} 
                                               onClick={async (e) => {
                                                    if (!item.handle) {
                                                        e.preventDefault()
                                                        try {
                                                            const searchUrl = `/api/product-search?q=${encodeURIComponent(item.title)}${item.productId ? `&id=${item.productId}` : ''}`
                                                            const res = await fetch(searchUrl)
                                                            const data = await res.json()
                                                            if (data.success && data.handle) {
                                                                window.open(`/products/${data.handle}`, '_blank')
                                                            } else {
                                                                alert('Product not found. Please search manually on the store.')
                                                            }
                                                        } catch (err) {
                                                            alert('Error finding product: ' + err.message)
                                                        }
                                                    }
                                               }}
                                               target={item.handle ? '_blank' : undefined}
                                               rel={item.handle ? 'noopener noreferrer' : undefined}
                                               className="flex items-center gap-4 bg-white rounded-xl p-4 text-sm hover:shadow-lg hover:border-coral transition-all border-2 border-transparent cursor-pointer">
                                                <div className="flex-shrink-0 bg-gray-50 rounded-lg p-2">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.title} className="w-32 h-32 object-contain" />
                                                    ) : (
                                                        <div className="w-32 h-32 flex items-center justify-center text-4xl">📦</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-charcoal text-base leading-snug">{item.title}</p>
                                                    {item.variantTitle && <p className="text-xs text-gray-400 mt-2">{item.variantTitle}</p>}
                                                    <p className="text-xs text-coral font-semibold mt-2">✓ Click to view product →</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-sm text-gray-400">x{item.quantity}</p>
                                                    <p className="font-bold text-coral text-lg">PKR {(parseFloat(item.price || 0) * item.quantity).toLocaleString()}</p>
                                                </div>
                                            </a>
                                            )
                                        })}
                                    </div>
                                    <div className="border-t border-gray-100 mt-3 pt-3 space-y-1 text-sm">
                                        <div className="flex justify-between text-gray-400">
                                            <span>Subtotal</span><span>PKR {(selected.subtotal || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                            <span>Shipping</span><span>PKR {(selected.shipping || 250).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between font-display text-base pt-1 border-t border-gray-100">
                                            <span>Total</span>
                                            <span className="text-coral font-bold">PKR {(selected.total || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* WhatsApp — only for pending */}
                                {selected.status === 'pending' && (
                                    <a href={buildWhatsAppMsg(selected)} target="_blank" rel="noopener noreferrer"
                                       className="w-full bg-green-500 text-white font-display text-sm py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-600 transition-colors block text-center">
                                        💬 Contact Customer on WhatsApp
                                    </a>
                                )}

                                {/* Status radio buttons */}
                                <div className="bg-cream rounded-2xl p-4">
                                    <p className="font-display text-sm text-charcoal mb-3">🚚 Courier Tracking (PostEx)</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={trackingInput}
                                            onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                                            placeholder="Enter AWB / tracking number"
                                            className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-white text-sm font-semibold"
                                        />
                                        <button
                                            onClick={saveTracking}
                                            disabled={updating}
                                            className="px-4 py-2 rounded-xl bg-coral text-white text-sm font-semibold hover:bg-opacity-90 disabled:opacity-70"
                                        >
                                            Save
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Saved tracking appears on customer Track Order page.</p>
                                </div>

                                {/* Status radio buttons */}
                                <div className="bg-cream rounded-2xl p-4">
                                    <p className="font-display text-sm text-charcoal mb-3">📋 Update Order Status</p>
                                    <div className="space-y-2">
                                        {allStatuses.map(s => (
                                            <label key={s}
                                                   className={'flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ' +
                                                       (selected.status === s ? 'border-coral bg-coral/5' : 'border-transparent bg-white hover:border-coral/30')}>
                                                <input type="radio" name="status" value={s}
                                                       checked={selected.status === s}
                                                       onChange={() => updateStatus(selected.id, s)}
                                                       disabled={updating}
                                                       className="accent-coral w-4 h-4" />
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="text-lg">{statusConfig[s]?.icon}</span>
                                                    <div>
                                                        <p className={'font-semibold text-sm ' + (selected.status === s ? 'text-coral' : 'text-charcoal')}>
                                                            {statusConfig[s]?.label}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {s === 'pending'    && 'Order received, awaiting confirmation'}
                                                            {s === 'processing' && 'Order confirmed, preparing to ship'}
                                                            {s === 'dispatched' && 'Order shipped, on the way'}
                                                            {s === 'delivered'  && 'Order delivered to customer'}
                                                            {s === 'cancelled'  && 'Order cancelled'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {selected.status === s && (
                                                    <span className="text-coral font-bold text-xs ml-auto">● Current</span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                    {updating && (
                                        <p className="text-xs text-coral text-center mt-2 animate-pulse">Updating status...</p>
                                    )}
                                </div>

                                {/* Notes */}
                                {selected.notes && (
                                    <div className="bg-sunny/20 rounded-2xl p-3">
                                        <p className="text-xs text-gray-500">
                                            <span className="font-semibold">Notes:</span> {selected.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}