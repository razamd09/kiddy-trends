'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPortalNav from '@/components/AdminPortalNav'

const PRESETS = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this_week', label: 'This Week' },
    { id: 'last_week', label: 'Last Week' },
    { id: 'this_month', label: 'Monthly Sale' },
]

export default function AdminBestSellersPage() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()

    const [preset, setPreset] = useState('all')
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
            try {
                const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await res.json()
                if (!data.valid) { localStorage.removeItem('admin_token'); router.push('/admin'); return }
                setVerified(true)
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

    useEffect(() => {
        if (!verified) return
        load()
    }, [verified, preset])

    async function load() {
        setLoading(true)
        setError('')
        try {
            const token = localStorage.getItem('admin_token') || ''
            const res = await fetch('/api/admin/best-sellers?preset=' + preset, { headers: { 'x-admin-token': token } })
            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'Failed to load')
            setProducts(data.products || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
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
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Best Sellers</h1>
                </div>
                <p className="text-xs text-gray-400">Website orders only — ranked by number of orders, cancelled orders excluded</p>
            </div>
            <AdminPortalNav />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-wrap gap-2 mb-6">
                    {PRESETS.map((p) => (
                        <button key={p.id} onClick={() => setPreset(p.id)}
                                className={'px-5 py-2 rounded-full font-display text-sm transition-colors ' + (preset === p.id ? 'bg-coral text-white' : 'bg-white text-charcoal border-2 border-gray-100 hover:border-coral/40')}>
                            {p.label}
                        </button>
                    ))}
                </div>

                {loading && <p className="text-sm text-gray-400">Loading...</p>}
                {error && <p className="text-sm text-red-500">{error}</p>}
                {!loading && !error && products.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">No website orders in this range.</p>
                )}
                {!loading && !error && products.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                        {products.map((p) => (
                            <div key={p.title} className="bg-white rounded-2xl p-3 shadow-sm">
                                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3">
                                    {p.image ? (
                                        <img src={p.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No image</div>
                                    )}
                                    <span className="absolute top-2 right-2 bg-charcoal text-white text-xs font-display px-3 py-1 rounded-full shadow">
                                        {p.orderCount} {p.orderCount === 1 ? 'order' : 'orders'}
                                    </span>
                                </div>
                                <p className="text-sm text-charcoal line-clamp-2">{p.title}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
