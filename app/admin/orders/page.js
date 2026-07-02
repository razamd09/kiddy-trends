'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [verified, setVerified] = useState(false)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [updatingId, setUpdatingId] = useState(null)
    const [editingNotes, setEditingNotes] = useState({})
    const router = useRouter()

    const statusColors = {
        pending: 'bg-orange-100 text-orange-600',
        processing: 'bg-blue-100 text-blue-600',
        dispatched: 'bg-purple-100 text-purple-600',
        delivered: 'bg-green-100 text-green-600',
        cancelled: 'bg-red-100 text-red-600',
    }

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) {
                router.push('/admin')
                return
            }
            try {
                const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await res.json()
                if (!data.valid) {
                    localStorage.removeItem('admin_token')
                    router.push('/admin')
                } else {
                    setVerified(true)
                    fetchOrders(1, token)
                }
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

    useEffect(() => {
        if (verified) {
            setPage(1)
        }
    }, [statusFilter, searchTerm, verified])

    async function fetchOrders(pageNum, token) {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(pageNum) })
            if (statusFilter && statusFilter !== 'all') {
                params.set('status', statusFilter)
            }
            const res = await fetch('/api/admin/orders?' + params.toString(), {
                headers: { 'x-admin-token': token }
            })
            const data = await res.json()
            if (data.error) {
                setOrders([])
                setTotal(0)
            } else {
                setOrders(data.orders || [])
                setTotal(data.total || 0)
            }
        } catch (err) {
            console.error('Failed to fetch orders:', err)
            setOrders([])
            setTotal(0)
        }
        setLoading(false)
    }

    async function updateOrderStatus(orderId, newStatus) {
        setUpdatingId(orderId)
        const token = localStorage.getItem('admin_token')
        try {
            const res = await fetch('/api/admin/orders', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({
                    id: orderId,
                    status: newStatus,
                    notes: editingNotes[orderId] || ''
                })
            })
            const data = await res.json()
            if (data.success) {
                fetchOrders(page, token)
                setEditingNotes(prev => {
                    const updated = { ...prev }
                    delete updated[orderId]
                    return updated
                })
            } else {
                alert('Failed to update order: ' + (data.error || 'Unknown error'))
            }
        } catch (err) {
            alert('Error updating order: ' + err.message)
        }
        setUpdatingId(null)
    }

    function logout() {
        localStorage.removeItem('admin_token')
        router.push('/admin')
    }

    const filtered = orders.filter(order => {
        if (!searchTerm) return true
        const search = searchTerm.toLowerCase()
        return (
            order.id?.toLowerCase().includes(search) ||
            order.customer_name?.toLowerCase().includes(search) ||
            order.customer_email?.toLowerCase().includes(search) ||
            order.customer_phone?.toLowerCase().includes(search)
        )
    })

    const maxPages = Math.ceil(total / 20)

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
                <button onClick={logout} className="text-sm text-gray-400 hover:text-coral">Logout →</button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                        <div className="flex-1">
                            <label className="block font-semibold text-sm text-charcoal mb-1">Search Orders</label>
                            <input
                                type="text"
                                placeholder="🔍 Search by order ID, customer name, email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-sm text-charcoal mb-1">Filter by Status</label>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm"
                            >
                                <option value="all">All Orders</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="dispatched">Dispatched</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                {loading ? (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-4xl mb-2 animate-pulse">⏳</p>
                        <p>Loading orders...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
                        <p className="text-4xl mb-2">📭</p>
                        <p>No orders found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(order => (
                            <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Order ID</p>
                                        <p className="font-semibold text-sm text-charcoal">{order.id}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Customer</p>
                                        <p className="font-semibold text-sm text-charcoal">{order.customer_name}</p>
                                        <p className="text-xs text-gray-400 mt-1">{order.customer_city}</p>
                                        {order.customer_phone && (
                                            <p className="text-xs text-gray-400">{order.customer_phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                                        <p className="font-bold text-sm text-coral">PKR {order.total?.toLocaleString()}</p>
                                        <p className="text-xs text-gray-400 mt-1">Items: {order.items_count || 0}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Status</p>
                                        <select
                                            value={order.status || 'pending'}
                                            onChange={e => updateOrderStatus(order.id, e.target.value)}
                                            disabled={updatingId === order.id}
                                            className={`text-xs px-3 py-1.5 rounded-full font-semibold border-0 cursor-pointer ${statusColors[order.status] || 'bg-gray-100 text-gray-500'}`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="dispatched">Dispatched</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                                        <textarea
                                            value={editingNotes[order.id] || order.notes || ''}
                                            onChange={e => setEditingNotes(prev => ({
                                                ...prev,
                                                [order.id]: e.target.value
                                            }))}
                                            placeholder="Add notes..."
                                            className="w-full text-xs px-2 py-1 rounded-lg border border-gray-100 focus:border-coral focus:outline-none resize-none"
                                            rows="2"
                                        />
                                        {editingNotes[order.id] !== undefined && editingNotes[order.id] !== (order.notes || '') && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, order.status)}
                                                disabled={updatingId === order.id}
                                                className="mt-1 text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded hover:bg-green-200 disabled:opacity-50"
                                            >
                                                Save
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && maxPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        <button
                            onClick={() => { setPage(Math.max(1, page - 1)); fetchOrders(Math.max(1, page - 1), localStorage.getItem('admin_token')) }}
                            disabled={page === 1}
                            className="px-3 py-2 rounded-lg border border-gray-100 disabled:opacity-50 hover:bg-gray-50"
                        >
                            ← Prev
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: maxPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => { setPage(p); fetchOrders(p, localStorage.getItem('admin_token')) }}
                                    className={`w-8 h-8 rounded-lg font-semibold ${page === p ? 'bg-coral text-white' : 'border border-gray-100 hover:bg-gray-50'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => { setPage(Math.min(maxPages, page + 1)); fetchOrders(Math.min(maxPages, page + 1), localStorage.getItem('admin_token')) }}
                            disabled={page === maxPages}
                            className="px-3 py-2 rounded-lg border border-gray-100 disabled:opacity-50 hover:bg-gray-50"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
