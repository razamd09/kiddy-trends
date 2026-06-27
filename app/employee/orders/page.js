'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const allStatuses = ['pending', 'processing', 'dispatched', 'delivered', 'cancelled']

export default function EmployeeOrdersPage() {
    const [employee, setEmployee] = useState(null)
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [updatingId, setUpdatingId] = useState(null)
    const router = useRouter()

    useEffect(() => {
        const stored = localStorage.getItem('employee')
        if (!stored) { router.push('/employee'); return }
        const emp = JSON.parse(stored)
        const canAccess = emp?.permissions?.can_manage_orders !== false
        if (!canAccess) { router.push('/employee/dashboard'); return }
        setEmployee(emp)
        fetchOrders('all')
    }, [])

    async function fetchOrders(status) {
        setLoading(true)
        const res = await fetch('/api/admin/orders?page=1&status=' + (status || filter), { cache: 'no-store' })
        const data = await res.json()
        setOrders(data.orders || [])
        setLoading(false)
    }

    async function updateStatus(id, status) {
        setUpdatingId(id)
        await fetch('/api/admin/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        })
        await fetchOrders(filter)
        setUpdatingId(null)
    }

    if (!employee) return null

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/employee/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Manage Orders</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                    {['all', ...allStatuses].map((s) => (
                        <button
                            key={s}
                            onClick={() => { setFilter(s); fetchOrders(s) }}
                            className={'px-3 py-1.5 rounded-full text-xs font-semibold border-2 ' + (filter === s ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-gray-200')}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-gray-400">Loading orders...</div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-gray-400">No orders found</div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((o) => (
                            <div key={o.id} className="bg-white rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <p className="font-display text-charcoal">{o.customer_name}</p>
                                    <p className="text-xs text-gray-400">{o.customer_city} · {new Date(o.created_at).toLocaleString('en-PK')}</p>
                                    <p className="text-sm text-coral font-bold mt-1">PKR {(o.total || 0).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={o.status || 'pending'}
                                        onChange={(e) => updateStatus(o.id, e.target.value)}
                                        disabled={updatingId === o.id}
                                        className="px-3 py-2 rounded-xl border-2 border-gray-100 text-sm"
                                    >
                                        {allStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
