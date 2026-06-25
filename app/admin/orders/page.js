'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const statusColors = {
    pending:    'bg-orange-100 text-orange-600',
    processing: 'bg-blue-100 text-blue-600',
    dispatched: 'bg-purple-100 text-purple-600',
    delivered:  'bg-green-100 text-green-600',
    cancelled:  'bg-red-100 text-red-600',
}

export default function AdminOrders() {
    const [orders, setOrders]   = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter]   = useState('all')
    const [page, setPage]       = useState(1)
    const [total, setTotal]     = useState(0)
    const [selected, setSelected] = useState(null)
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('admin_token')
        if (!token) { router.push('/admin'); return }
        fetchOrders(token)
    }, [filter, page])

    async function fetchOrders(token) {
        setLoading(true)
        const t = token || localStorage.getItem('admin_token')
        const res = await fetch('/api/admin/orders?page=' + page + '&status=' + filter, {
            headers: { 'x-admin-token': t }
        })
        const data = await res.json()
        setOrders(data.orders || [])
        setTotal(data.total || 0)
        setLoading(false)
    }

    async function updateStatus(id, status) {
        const token = localStorage.getItem('admin_token')
        await fetch('/api/admin/orders', {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
            body:    JSON.stringify({ id, status })
        })
        fetchOrders()
        if (selected?.id === id) setSelected({ ...selected, status })
    }

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-coral">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Orders</h1>
                    <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{total}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Filter tabs */}
                <div className="flex gap-2 flex-wrap mb-6">
                    {['all','pending','processing','dispatched','delivered','cancelled'].map(s => (
                        <button key={s} onClick={() => { setFilter(s); setPage(1) }}
                                className={'px-4 py-2 rounded-full text-sm font-semibold transition-all ' + (filter === s ? 'bg-coral text-white' : 'bg-white text-charcoal hover:border-coral border-2 border-gray-100')}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    {/* Orders list */}
                    <div className="space-y-3">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-20" />
                            ))
                        ) : orders.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <p className="text-4xl mb-2">📭</p>
                                <p>No orders found</p>
                            </div>
                        ) : orders.map(order => (
                            <div key={order.id}
                                 onClick={() => setSelected(order)}
                                 className={'bg-white rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all border-2 ' + (selected?.id === order.id ? 'border-coral' : 'border-transparent')}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-display text-base text-charcoal">{order.customer_name}</p>
                                    <span className={'text-xs px-2 py-1 rounded-full font-bold ' + (statusColors[order.status] || 'bg-gray-100 text-gray-500')}>
                    {order.status}
                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400">{order.customer_city} · {order.customer_phone}</p>
                                        <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                                    </div>
                                    <p className="font-bold text-coral">PKR {order.total?.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {total > 20 && (
                            <div className="flex justify-center gap-2 mt-4">
                                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                                        className="px-4 py-2 bg-white rounded-xl text-sm disabled:opacity-50">← Prev</button>
                                <span className="px-4 py-2 bg-coral text-white rounded-xl text-sm">Page {page}</span>
                                <button onClick={() => setPage(p => p+1)} disabled={page * 20 >= total}
                                        className="px-4 py-2 bg-white rounded-xl text-sm disabled:opacity-50">Next →</button>
                            </div>
                        )}
                    </div>

                    {/* Order detail */}
                    {selected && (
                        <div className="bg-white rounded-2xl p-6 h-fit sticky top-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-display text-lg text-charcoal">Order Details</h3>
                                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-coral">✕</button>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="bg-cream rounded-xl p-3 space-y-2">
                                    <p className="text-sm"><span className="font-semibold">Name:</span> {selected.customer_name}</p>
                                    <p className="text-sm"><span className="font-semibold">Phone:</span> {selected.customer_phone}</p>
                                    <p className="text-sm"><span className="font-semibold">WhatsApp:</span> {selected.customer_whatsapp}</p>
                                    <p className="text-sm"><span className="font-semibold">City:</span> {selected.customer_city}</p>
                                    <p className="text-sm"><span className="font-semibold">Address:</span> {selected.customer_address}</p>
                                    {selected.customer_email && <p className="text-sm"><span className="font-semibold">Email:</span> {selected.customer_email}</p>}
                                </div>

                                {/* Items */}
                                {selected.items && (
                                    <div className="bg-cream rounded-xl p-3">
                                        <p className="font-semibold text-sm mb-2">Items:</p>
                                        {(typeof selected.items === 'string' ? JSON.parse(selected.items) : selected.items).map((item, i) => (
                                            <div key={i} className="flex justify-between text-xs py-1">
                                                <span>{item.title} x{item.quantity}</span>
                                                <span className="font-bold">PKR {(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-between font-display text-base">
                                    <span>Total</span>
                                    <span className="text-coral">PKR {selected.total?.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Status update */}
                            <div>
                                <p className="font-semibold text-sm text-charcoal mb-2">Update Status:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {['pending','processing','dispatched','delivered','cancelled'].map(s => (
                                        <button key={s} onClick={() => updateStatus(selected.id, s)}
                                                className={'py-2 rounded-xl text-xs font-bold transition-all ' + (selected.status === s ? 'bg-coral text-white' : 'bg-cream text-charcoal hover:bg-coral/20')}>
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* WhatsApp customer */}
                            <a href={'https://wa.me/' + selected.customer_whatsapp?.replace(/\D/g,'')}
                               target="_blank" rel="noopener noreferrer"
                               className="mt-4 w-full bg-green-500 text-white font-display text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                                💬 WhatsApp Customer
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}