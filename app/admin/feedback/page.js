'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminFeedback() {
    const [feedback, setFeedback] = useState([])
    const [loading, setLoading]   = useState(true)
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
                    fetchFeedback()
                }
            } catch { router.push('/admin') }
        }
        verify()
    }, [])

    async function fetchFeedback() {
        const res  = await fetch('/api/feedback')
        const data = await res.json()
        setFeedback(data.feedback || [])
        setLoading(false)
    }

    function logout() {
        localStorage.removeItem('admin_token')
        router.push('/admin')
    }

    function avgRating(key) {
        if (!feedback.length) return 0
        return (feedback.reduce((s, f) => s + (f[key] || 0), 0) / feedback.length).toFixed(1)
    }

    function Stars({ value }) {
        return (
            <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                    <span key={s} className={'text-sm ' + (s <= Math.round(value) ? 'text-yellow-400' : 'text-gray-200')}>★</span>
                ))}
            </div>
        )
    }

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
                    <h1 className="font-display text-xl text-charcoal">Customer Feedback</h1>
                    <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{feedback.length}</span>
                </div>
                <button onClick={logout} className="text-sm text-gray-400 hover:text-coral">Logout →</button>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Average ratings */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    {[
                        { label: 'Overall Experience',  key: 'overall_experience',    emoji: '⭐' },
                        { label: 'Representative',      key: 'representative_service', emoji: '👤' },
                        { label: 'Size Accuracy',       key: 'size_accuracy',         emoji: '📦' },
                        { label: 'Product Quality',     key: 'product_quality',       emoji: '✅' },
                        { label: 'Response Time',       key: 'response_time',         emoji: '⚡' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 text-center">
                            <p className="text-2xl mb-1">{stat.emoji}</p>
                            <p className="font-display text-2xl text-coral">{avgRating(stat.key)}</p>
                            <Stars value={avgRating(stat.key)} />
                            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Feedback list */}
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />)}
                    </div>
                ) : feedback.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
                        <p className="text-4xl mb-2">💝</p>
                        <p>No feedback yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {feedback.map((f, i) => (
                            <div key={i} className="bg-white rounded-2xl p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="font-display text-base text-charcoal">{f.customer_name || 'Anonymous'}</p>
                                        <p className="text-xs text-gray-400">{f.customer_phone || 'No phone'} · {new Date(f.created_at).toLocaleString('en-PK')}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex gap-0.5 justify-end">
                                            {[1,2,3,4,5].map(s => (
                                                <span key={s} className={'text-lg ' + (s <= f.overall_experience ? 'text-yellow-400' : 'text-gray-200')}>★</span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">Overall</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                    {[
                                        { label: 'Representative', value: f.representative_service, emoji: '👤' },
                                        { label: 'Size Accuracy',  value: f.size_accuracy,         emoji: '📦' },
                                        { label: 'Product Quality',value: f.product_quality,        emoji: '✅' },
                                        { label: 'Response Time',  value: f.response_time,          emoji: '⚡' },
                                    ].map((item, j) => (
                                        <div key={j} className="bg-cream rounded-xl p-3 text-center">
                                            <p className="text-lg mb-1">{item.emoji}</p>
                                            <div className="flex justify-center gap-0.5 mb-1">
                                                {[1,2,3,4,5].map(s => (
                                                    <span key={s} className={'text-xs ' + (s <= item.value ? 'text-yellow-400' : 'text-gray-200')}>★</span>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-400">{item.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {f.comments && (
                                    <div className="bg-sunny/10 rounded-xl p-3">
                                        <p className="text-xs text-gray-500 italic">"{f.comments}"</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}