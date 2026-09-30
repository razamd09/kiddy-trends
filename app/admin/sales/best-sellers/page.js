'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPortalNav from '@/components/AdminPortalNav'

export default function AdminBestSellersPage() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()

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
                load(token)
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

    async function load(token) {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/admin/best-sellers', { headers: { 'x-admin-token': token || localStorage.getItem('admin_token') || '' } })
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
                {loading && <p className="text-sm text-gray-400">Loading...</p>}
                {error && <p className="text-sm text-red-500">{error}</p>}
                {!loading && !error && products.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">No website orders yet.</p>
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
