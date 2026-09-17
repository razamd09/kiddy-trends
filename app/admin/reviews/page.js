'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPakistanDateTime } from '../../../lib/dateFormat'
import AdminPortalNav from '@/components/AdminPortalNav'

export default function AdminReviews() {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [verified, setVerified] = useState(false)
    const [filter, setFilter] = useState('all') // pending | approved | all
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
                    fetchReviews()
                }
            } catch { router.push('/admin') }
        }
        verify()
    }, [])

    async function fetchReviews() {
        setLoading(true)
        const token = localStorage.getItem('admin_token')
        try {
            const res  = await fetch('/api/admin/reviews', { headers: { 'x-admin-token': token } })
            const data = await res.json()
            setReviews(data.reviews || [])
        } catch {}
        setLoading(false)
    }

    async function setApproval(id, isApproved) {
        const token = localStorage.getItem('admin_token')
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_approved: isApproved } : r)))
        try {
            await fetch('/api/admin/reviews', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                body: JSON.stringify({ id, is_approved: isApproved }),
            })
        } catch {}
    }

    async function deleteReview(id) {
        if (!confirm('Delete this review permanently?')) return
        const token = localStorage.getItem('admin_token')
        setReviews((prev) => prev.filter((r) => r.id !== id))
        try {
            await fetch('/api/admin/reviews?id=' + encodeURIComponent(id), {
                method: 'DELETE',
                headers: { 'x-admin-token': token },
            })
        } catch {}
    }

    function logout() {
        localStorage.removeItem('admin_token')
        router.push('/admin')
    }

    const pendingCount = reviews.filter((r) => !r.is_approved).length
    const visibleReviews = reviews.filter((r) => {
        if (filter === 'pending') return !r.is_approved
        if (filter === 'approved') return r.is_approved
        return true
    })

    if (!verified) return (
        <div className="min-h-screen bg-cream flex items-center justify-center">
            <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Product Reviews</h1>
                    {pendingCount > 0 && (
                        <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full font-bold">{pendingCount} pending</span>
                    )}
                </div>
                <button onClick={logout} className="text-sm text-gray-400 hover:text-coral">Logout →</button>
            </div>
            <AdminPortalNav />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                <div className="flex gap-2 mb-6">
                    {[
                        { id: 'pending', label: 'Pending' },
                        { id: 'approved', label: 'Approved' },
                        { id: 'all', label: 'All' },
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setFilter(tab.id)}
                            className={'px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ' + (filter === tab.id ? 'bg-coral text-white border-coral' : 'bg-white text-charcoal border-gray-200 hover:border-coral/40')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)}
                    </div>
                ) : visibleReviews.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
                        <p className="text-4xl mb-2">📝</p>
                        <p>No {filter !== 'all' ? filter : ''} reviews</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visibleReviews.map((r) => (
                            <div key={r.id} className="bg-white rounded-2xl p-5">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div>
                                        <p className="font-display text-base text-charcoal">{r.customer_name}</p>
                                        <p className="text-xs text-gray-400">
                                            {r.products?.title || 'Product #' + r.product_id} · {formatPakistanDateTime(r.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex gap-0.5 flex-shrink-0">
                                        {[1,2,3,4,5].map((s) => (
                                            <span key={s} className={'text-base ' + (s <= r.rating ? 'text-yellow-400' : 'text-gray-200')}>★</span>
                                        ))}
                                    </div>
                                </div>

                                {r.review_text && (
                                    <p className="text-sm text-gray-600 mt-2 mb-3">"{r.review_text}"</p>
                                )}

                                <div className="flex items-center gap-2 mt-3">
                                    <span className={'text-xs px-2 py-1 rounded-full font-semibold ' + (r.is_approved ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600')}>
                                        {r.is_approved ? '✓ Live on site' : '⏳ Pending review'}
                                    </span>
                                    <div className="ml-auto flex gap-2">
                                        {!r.is_approved ? (
                                            <button onClick={() => setApproval(r.id, true)}
                                                className="text-xs bg-mint text-white px-3 py-1.5 rounded-full font-bold hover:bg-opacity-90">
                                                Approve
                                            </button>
                                        ) : (
                                            <button onClick={() => setApproval(r.id, false)}
                                                className="text-xs bg-gray-100 text-charcoal px-3 py-1.5 rounded-full font-bold hover:bg-gray-200">
                                                Unpublish
                                            </button>
                                        )}
                                        <button onClick={() => deleteReview(r.id)}
                                            className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-full font-bold hover:bg-red-100">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
