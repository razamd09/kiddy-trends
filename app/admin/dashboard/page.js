'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
    const [stats, setStats]     = useState(null)
    const [loading, setLoading] = useState(true)
    const [verified, setVerified] = useState(false)
    const router = useRouter()

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
                    fetchStats(token)
                }
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

    async function fetchStats(token) {
        try {
            const res  = await fetch('/api/admin/stats', { headers: { 'x-admin-token': token } })
            const data = await res.json()
            setStats(data)
        } catch {}
        setLoading(false)
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
                    <div className="w-10 h-10 bg-coral rounded-2xl flex items-center justify-center text-white font-display text-lg">K</div>
                    <div>
                        <p className="font-display text-lg text-charcoal">Kiddy Trends Admin</p>
                        <p className="text-xs text-gray-400">Management Portal</p>
                    </div>
                </div>
                <button onClick={logout} className="text-sm text-gray-400 hover:text-coral transition-colors">
                    Logout →
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Orders',    value: stats?.totalOrders || 0,    icon: '📦', color: 'bg-coral/10',   textColor: 'text-coral' },
                        { label: 'Today Orders',    value: stats?.todayOrders || 0,    icon: '🛍️', color: 'bg-sunny/30',   textColor: 'text-charcoal' },
                        { label: 'Pending Orders',  value: stats?.pendingOrders || 0,  icon: '⏳', color: 'bg-orange-50',  textColor: 'text-orange-500' },
                        { label: 'Total Customers', value: stats?.totalCustomers || 0, icon: '👥', color: 'bg-skyblue/20', textColor: 'text-charcoal' },
                        { label: 'Total Products',  value: stats?.totalProducts || 0,  icon: '👕', color: 'bg-mint/20',    textColor: 'text-charcoal' },
                        { label: 'Today Revenue',   value: 'PKR ' + (stats?.todayRevenue || 0).toLocaleString(), icon: '💰', color: 'bg-green-50',    textColor: 'text-green-600' },
                        { label: 'Total Revenue',   value: 'PKR ' + (stats?.totalRevenue || 0).toLocaleString(), icon: '📈', color: 'bg-lavender/20', textColor: 'text-charcoal' },
                        { label: 'Rewards Members', value: stats?.totalCustomers || 0, icon: '⭐', color: 'bg-sunny/20',   textColor: 'text-charcoal' },
                    ].map((stat, i) => (
                        <div key={i} className={'rounded-2xl p-4 ' + stat.color}>
                            <div className="text-2xl mb-2">{stat.icon}</div>
                            <p className={'font-display text-2xl ' + stat.textColor}>{stat.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Manage Orders',   href: '/admin/orders',     icon: '📦', color: 'bg-coral text-white' },
                        { label: 'Manage Products', href: '/admin/products',   icon: '👕', color: 'bg-charcoal text-white' },
                        { label: 'Employees',       href: '/admin/employees',  icon: '👥', color: 'bg-skyblue text-white' },
                        { label: 'Attendance',      href: '/admin/attendance', icon: '📅', color: 'bg-mint text-white' },
                        { label: 'Customers',       href: '/admin/customers',  icon: '💝', color: 'bg-lavender text-white' },
                        { label: 'View Website',    href: '/',                 icon: '🌐', color: 'bg-sunny text-charcoal' },
                    ].map((link, i) => (
                        <Link key={i} href={link.href}
                              className={'rounded-2xl p-5 text-center font-display text-base hover:opacity-90 transition-opacity block ' + link.color}>
                            <div className="text-3xl mb-2">{link.icon}</div>
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-xl text-charcoal">Recent Orders</h2>
                        <Link href="/admin/orders" className="text-coral text-sm hover:underline">View all →</Link>
                    </div>
                    <RecentOrders />
                </div>
            </div>
        </div>
    )
}

function RecentOrders() {
    const [orders, setOrders] = useState([])

    useEffect(() => {
        const token = localStorage.getItem('admin_token')
        if (!token) return
        fetch('/api/admin/orders?page=1', { headers: { 'x-admin-token': token } })
            .then(r => r.json())
            .then(data => setOrders(data.orders?.slice(0, 5) || []))
            .catch(() => {})
    }, [])

    const statusColors = {
        pending:    'bg-orange-100 text-orange-600',
        processing: 'bg-blue-100 text-blue-600',
        dispatched: 'bg-purple-100 text-purple-600',
        delivered:  'bg-green-100 text-green-600',
        cancelled:  'bg-red-100 text-red-600',
    }

    if (orders.length === 0) return (
        <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p>No orders yet</p>
        </div>
    )

    return (
        <div className="space-y-3">
            {orders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-cream rounded-xl">
                    <div>
                        <p className="font-semibold text-sm text-charcoal">{order.customer_name}</p>
                        <p className="text-xs text-gray-400">{order.customer_city} · {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-sm text-coral">PKR {order.total?.toLocaleString()}</p>
                        <span className={'text-xs px-2 py-0.5 rounded-full font-semibold ' + (statusColors[order.status] || 'bg-gray-100 text-gray-500')}>
              {order.status}
            </span>
                    </div>
                </div>
            ))}
        </div>
    )
}