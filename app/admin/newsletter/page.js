'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPakistanDateTime } from '../../../lib/dateFormat'

export default function AdminNewsletterPage() {
    const [verified, setVerified] = useState(false)
    const [loading, setLoading] = useState(true)
    const [subscribers, setSubscribers] = useState([])
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [sendResult, setSendResult] = useState(null)
    const [sendError, setSendError] = useState('')
    const router = useRouter()

    useEffect(() => {
        async function verifyAndLoad() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
            try {
                const authRes = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const authData = await authRes.json()
                if (!authData.valid) {
                    localStorage.removeItem('admin_token')
                    router.push('/admin')
                    return
                }
                setVerified(true)

                const res = await fetch('/api/admin/newsletter', { headers: { 'x-admin-token': token } })
                const data = await res.json()
                setSubscribers(data.subscribers || [])
            } catch {
                router.push('/admin')
                return
            }
            setLoading(false)
        }
        verifyAndLoad()
    }, [])

    function logout() {
        localStorage.removeItem('admin_token')
        router.push('/admin')
    }

    async function handleSendCampaign(e) {
        e.preventDefault()
        if (sending) return
        if (!subject.trim() || !message.trim()) {
            setSendError('Subject and message are required')
            return
        }
        if (!window.confirm('Send this email to all ' + subscribers.length + ' subscribers?')) return

        setSending(true)
        setSendError('')
        setSendResult(null)
        try {
            const token = localStorage.getItem('admin_token')
            const res = await fetch('/api/admin/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to send campaign')
            setSendResult(data)
            setSubject('')
            setMessage('')
        } catch (err) {
            setSendError(err.message || 'Failed to send campaign')
        } finally {
            setSending(false)
        }
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
                    <h1 className="font-display text-xl text-charcoal">Newsletter</h1>
                    <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{subscribers.length}</span>
                </div>
                <button onClick={logout} className="text-sm text-gray-400 hover:text-coral">Logout →</button>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

                {/* Campaign form */}
                <div className="bg-white rounded-2xl p-6">
                    <h2 className="font-display text-lg text-charcoal mb-4">Send Campaign</h2>
                    <form onSubmit={handleSendCampaign} className="space-y-3">
                        <input type="text" placeholder="Subject" value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-coral text-sm" />
                        <textarea placeholder="Message" value={message} rows={5}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-coral text-sm resize-none" />
                        <button type="submit" disabled={sending || subscribers.length === 0}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-coral hover:bg-opacity-90 disabled:bg-gray-300 disabled:text-gray-500">
                            {sending ? 'Sending…' : 'Send to ' + subscribers.length + ' Subscriber' + (subscribers.length !== 1 ? 's' : '')}
                        </button>
                        {sendError && <p className="text-sm text-red-500 font-semibold">{sendError}</p>}
                        {sendResult && (
                            <p className="text-sm text-green-600 font-semibold">
                                Sent to {sendResult.sent} subscriber{sendResult.sent !== 1 ? 's' : ''}
                                {sendResult.failed > 0 ? (' — ' + sendResult.failed + ' failed') : ''}.
                            </p>
                        )}
                    </form>
                </div>

                {/* Subscriber list */}
                <div className="bg-white rounded-2xl overflow-hidden">
                    <h2 className="font-display text-lg text-charcoal px-6 pt-6 pb-2">Subscribers</h2>
                    {loading ? (
                        <div className="p-6 text-gray-400">Loading subscribers...</div>
                    ) : subscribers.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <p className="text-4xl mb-2">📧</p>
                            <p>No subscribers yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-cream text-gray-500">
                                    <tr>
                                        <th className="text-left px-6 py-3 font-semibold">Email</th>
                                        <th className="text-left px-6 py-3 font-semibold">Source</th>
                                        <th className="text-left px-6 py-3 font-semibold">Subscribed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscribers.map((s) => (
                                        <tr key={s.id} className="border-t border-gray-100">
                                            <td className="px-6 py-3 font-semibold text-charcoal">{s.email}</td>
                                            <td className="px-6 py-3 text-gray-500">{s.source || '-'}</td>
                                            <td className="px-6 py-3 text-gray-500">{formatPakistanDateTime(s.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
