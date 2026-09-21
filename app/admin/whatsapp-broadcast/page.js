'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPortalNav from '@/components/AdminPortalNav'

const BATCH_SIZE = 40

export default function AdminWhatsAppBroadcastPage() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [productLines, setProductLines] = useState([])
    const [recipientCount, setRecipientCount] = useState(0)
    const [loadError, setLoadError] = useState('')

    const [sending, setSending] = useState(false)
    const [progress, setProgress] = useState({ processed: 0, sent: 0, failed: 0 })
    const [errors, setErrors] = useState([])
    const [finished, setFinished] = useState(false)

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
            try {
                const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await res.json()
                if (!data.valid) { localStorage.removeItem('admin_token'); router.push('/admin'); return }
                setVerified(true)
                loadPreview()
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

    async function loadPreview() {
        setLoading(true)
        setLoadError('')
        try {
            const res = await fetch('/api/admin/whatsapp-campaign')
            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'Failed to load preview')
            setProductLines(data.productLines || [])
            setRecipientCount(data.recipientCount || 0)
        } catch (err) {
            setLoadError(err.message)
        }
        setLoading(false)
    }

    async function launchCampaign() {
        if (sending) return
        if (!window.confirm('Send this New Arrivals broadcast to all ' + recipientCount + ' customers on WhatsApp right now? This cannot be undone.')) return

        setSending(true)
        setFinished(false)
        setErrors([])
        setProgress({ processed: 0, sent: 0, failed: 0 })

        let offset = 0
        let totals = { processed: 0, sent: 0, failed: 0 }
        let allErrors = []

        try {
            while (true) {
                const res = await fetch('/api/admin/whatsapp-campaign', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ offset, limit: BATCH_SIZE, productLines }),
                })
                const data = await res.json()
                if (!data.success) throw new Error(data.error || 'Send failed')

                totals = {
                    processed: totals.processed + data.processed,
                    sent: totals.sent + data.sent,
                    failed: totals.failed + data.failed,
                }
                if (data.errors?.length) allErrors = [...allErrors, ...data.errors].slice(0, 10)
                setProgress(totals)
                setErrors(allErrors)

                if (data.done) break
                offset += BATCH_SIZE
            }
        } catch (err) {
            setErrors((prev) => [...prev, err.message].slice(0, 10))
        }

        setSending(false)
        setFinished(true)
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
                    <h1 className="font-display text-xl text-charcoal">WhatsApp Broadcast</h1>
                </div>
                <p className="text-xs text-gray-400">New Arrivals campaign · sent to every customer's WhatsApp</p>
            </div>
            <AdminPortalNav />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">What will be sent</p>
                    <p className="text-xs text-gray-500 mb-4">
                        Every customer gets a WhatsApp message with the {productLines.length || 5} newest New Arrivals below, via the
                        {' '}<code className="bg-cream px-1.5 py-0.5 rounded">new_arrivals_broadcast_kt</code> Marketing template
                        (must be approved in Meta Business Manager first — see WHATSAPP_SETUP.md).
                    </p>

                    {loading && <p className="text-sm text-gray-400">Loading preview...</p>}
                    {loadError && <p className="text-sm text-red-500">{loadError}</p>}

                    {!loading && !loadError && (
                        <>
                            <ul className="space-y-1.5 mb-4">
                                {productLines.map((line, i) => (
                                    <li key={i} className="text-sm text-charcoal bg-cream rounded-xl px-3 py-2">{line}</li>
                                ))}
                            </ul>
                            <button onClick={loadPreview} disabled={sending}
                                    className="text-xs text-coral hover:underline disabled:opacity-40">↻ Refresh picks</button>
                        </>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">Recipients</p>
                    <p className="text-sm text-gray-500 mb-4">{recipientCount.toLocaleString()} customers have a WhatsApp number on file.</p>

                    <button onClick={launchCampaign} disabled={sending || loading || recipientCount === 0}
                            className="px-6 py-3 bg-coral text-white font-display text-sm rounded-full hover:bg-opacity-90 disabled:opacity-50">
                        {sending ? 'Sending...' : '🚀 Launch Campaign'}
                    </button>

                    {(sending || finished) && (
                        <div className="mt-5">
                            <div className="w-full bg-cream rounded-full h-2 mb-2 overflow-hidden">
                                <div className="bg-coral h-2 transition-all"
                                     style={{ width: (recipientCount ? (progress.processed / recipientCount) * 100 : 0) + '%' }} />
                            </div>
                            <p className="text-sm text-charcoal">
                                {progress.processed} / {recipientCount} processed ·
                                <span className="text-green-600 font-semibold"> {progress.sent} sent</span>
                                {progress.failed > 0 && <span className="text-red-500 font-semibold"> · {progress.failed} failed</span>}
                            </p>
                            {finished && !sending && <p className="text-sm font-semibold text-charcoal mt-1">✓ Campaign finished</p>}
                            {errors.length > 0 && (
                                <div className="mt-2 text-xs text-red-500 space-y-0.5">
                                    {errors.map((e, i) => <p key={i}>{e}</p>)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-sunny/20 rounded-2xl p-4 text-xs text-gray-600">
                    <strong>Before your first launch:</strong> WhatsApp Marketing messages require the recipient to have opted in to
                    promotional messages — not just placed an order. Make sure that's true for this customer list before sending, or
                    Meta may restrict the number. New WhatsApp Business numbers also start on a lower daily-messaging tier that scales
                    up over time, so a very large first broadcast may not fully deliver.
                </div>
            </div>
        </div>
    )
}
