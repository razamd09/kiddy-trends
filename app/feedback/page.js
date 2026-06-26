
'use client'
import { useState } from 'react'
import Link from 'next/link'

const questions = [
    { id: 'overall_experience',    label: "How's your experience with Kiddy Trends?",          emoji: '⭐' },
    { id: 'representative_service',label: 'Have you been served well by our representative?',  emoji: '👤' },
    { id: 'size_accuracy',         label: 'Did you receive the perfect sizes in your order?',   emoji: '📦' },
    { id: 'product_quality',       label: 'Are you satisfied with the product quality?',        emoji: '✅' },
    { id: 'response_time',         label: "How's the response time from Kiddy Trends?",         emoji: '⚡' },
]

function StarRating({ value, onChange }) {
    const [hovered, setHovered] = useState(0)

    return (
        <div className="flex gap-2">
            {[1,2,3,4,5].map(star => (
                <button key={star} type="button"
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        className="text-3xl transition-transform hover:scale-110">
                    {star <= (hovered || value) ? '⭐' : '☆'}
                </button>
            ))}
            {value > 0 && (
                <span className="text-sm text-gray-400 self-center ml-1">
          {value === 1 ? 'Poor' : value === 2 ? 'Fair' : value === 3 ? 'Good' : value === 4 ? 'Very Good' : 'Excellent'}
        </span>
            )}
        </div>
    )
}

export default function FeedbackPage() {
    const [form, setForm] = useState({
        customer_name:          '',
        customer_phone:         '',
        overall_experience:     0,
        representative_service: 0,
        size_accuracy:          0,
        product_quality:        0,
        response_time:          0,
        comments:               '',
    })
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted]   = useState(false)
    const [error, setError]           = useState('')

    function formatPhone(val) {
        let digits = String(val || '').replace(/\D/g, '')
        if (digits.startsWith('92') && digits.length > 10) digits = digits.slice(2)
        if (digits.startsWith('0') && digits.length > 10) digits = digits.slice(1)
        return digits.slice(0, 10)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const unanswered = questions.filter(q => form[q.id] === 0)
        if (unanswered.length > 0) {
            setError('Please rate all questions before submitting')
            return
        }
        if (form.customer_phone && form.customer_phone.length !== 10) {
            setError('Enter a valid 10-digit phone number without leading 0')
            return
        }
        setSubmitting(true)
        setError('')
        try {
            const payload = {
                ...form,
                customer_phone: form.customer_phone ? ('+92' + form.customer_phone) : '',
            }
            const res  = await fetch('/api/feedback', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            })
            const data = await res.json()
            if (data.success) {
                setSubmitted(true)
            } else {
                setError(data.error || 'Something went wrong')
            }
        } catch {
            setError('Something went wrong. Please try again.')
        }
        setSubmitting(false)
    }

    if (submitted) return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="font-display text-3xl text-charcoal mb-3">Thank You!</h2>
                <p className="text-gray-500 mb-6">Your feedback means the world to us. We'll keep improving to serve you better!</p>
                <div className="bg-sunny/20 rounded-2xl p-4 mb-6">
                    <p className="text-sm text-charcoal font-semibold">Your overall rating</p>
                    <div className="flex justify-center mt-2">
                        {[1,2,3,4,5].map(s => (
                            <span key={s} className="text-2xl">{s <= form.overall_experience ? '⭐' : '☆'}</span>
                        ))}
                    </div>
                </div>
                <Link href="/" className="btn-primary">Continue Shopping 🛍️</Link>
            </div>
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="text-5xl mb-4">💝</div>
                <h1 className="section-title mb-3">Share Your Feedback</h1>
                <p className="text-gray-500">Help us improve your shopping experience at Kiddy Trends</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Customer info */}
                <div className="bg-white rounded-3xl p-6 space-y-4">
                    <p className="font-display text-lg text-charcoal">Your Details <span className="text-gray-400 font-body text-sm">(optional)</span></p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-1">Your Name</label>
                            <input type="text" placeholder="e.g. Sara Ahmed" value={form.customer_name}
                                   onChange={e => setForm({...form, customer_name: e.target.value})}
                                   className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-charcoal mb-1">Phone Number</label>
                            <div className="flex gap-2">
                                <div className="bg-cream border-2 border-gray-100 rounded-2xl px-3 flex items-center text-sm font-bold text-charcoal flex-shrink-0">🇵🇰 +92</div>
                                <input type="tel" placeholder="3360677340" value={form.customer_phone}
                                       onChange={e => setForm({...form, customer_phone: formatPhone(e.target.value)})}
                                       maxLength={10}
                                       className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Enter 10 digits without 0 (optional)</p>
                        </div>
                    </div>
                </div>

                {/* Rating questions */}
                <div className="bg-white rounded-3xl p-6 space-y-6">
                    <p className="font-display text-lg text-charcoal">Rate Your Experience</p>
                    {questions.map((q, i) => (
                        <div key={q.id} className={'pb-6 ' + (i < questions.length - 1 ? 'border-b border-gray-100' : '')}>
                            <div className="flex items-start gap-3 mb-3">
                                <span className="text-2xl flex-shrink-0">{q.emoji}</span>
                                <p className="font-semibold text-sm text-charcoal">{q.label}</p>
                            </div>
                            <StarRating
                                value={form[q.id]}
                                onChange={val => setForm({...form, [q.id]: val})}
                            />
                        </div>
                    ))}
                </div>

                {/* Comments */}
                <div className="bg-white rounded-3xl p-6">
                    <label className="block font-display text-lg text-charcoal mb-3">
                        Any Additional Comments? <span className="text-gray-400 font-body text-sm">(optional)</span>
                    </label>
                    <textarea value={form.comments}
                              onChange={e => setForm({...form, comments: e.target.value})}
                              placeholder="Tell us what you loved or how we can improve..."
                              rows={4}
                              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm resize-none" />
                </div>

                {error && (
                    <div className="bg-red-50 rounded-2xl p-4 text-center">
                        <p className="text-red-500 text-sm">{error}</p>
                    </div>
                )}

                <button type="submit" disabled={submitting}
                        className="w-full bg-coral text-white font-display text-lg py-4 rounded-2xl hover:bg-opacity-90 transition-all hover:scale-[1.02] shadow-md disabled:opacity-70">
                    {submitting ? 'Submitting...' : 'Submit Feedback 💝'}
                </button>

                <p className="text-center text-xs text-gray-400">
                    Your feedback helps us serve you better. Thank you! 🙏
                </p>
            </form>
        </div>
    )
}