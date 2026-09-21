'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPortalNav from '@/components/AdminPortalNav'

const BATCH_SIZE = 100
const MAX_PRODUCTS = 5
const POOL_LIMIT = 100
const SITE_URL = 'https://thekiddytrends.com'

function isNewArrival(product) {
    return String(product?.product_version || '').trim().toLowerCase().includes('new arrival')
}

function firstImage(product) {
    const images = product?.images
    if (!Array.isArray(images) || images.length === 0) return null
    const first = images[0]
    return typeof first === 'string' ? first : (first?.src || null)
}

function cleanTitle(rawTitle) {
    return String(rawTitle || '')
        .replace(/^\s*#?\s*Kids\s+Affordable\s+Collection\s*(?:2026)?\s*[:\-]*\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 60)
}

// Matches the server's own padding so the preview is exactly what recipients see.
function buildProductLines(selected) {
    const lines = selected.map((p) => cleanTitle(p.title) + ' – ' + SITE_URL + '/products/prd_id=' + p.id)
    while (lines.length < MAX_PRODUCTS) {
        lines.push('✨ More new arrivals at ' + SITE_URL + '/collections')
    }
    return lines
}

function parseTestNumbers(input) {
    return String(input || '')
        .split(/[,\n]/)
        .map((v) => v.trim())
        .filter(Boolean)
}

export default function AdminWhatsAppBroadcastPage() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()
    const dragRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [recipientCount, setRecipientCount] = useState(0)
    const [loadError, setLoadError] = useState('')

    const [pool, setPool] = useState([])
    const [poolLoading, setPoolLoading] = useState(true)
    const [selected, setSelected] = useState([])

    const [testNumbersInput, setTestNumbersInput] = useState('')
    const [testSending, setTestSending] = useState(false)
    const [testResult, setTestResult] = useState(null)

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
                loadAll()
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

    function token() {
        return localStorage.getItem('admin_token') || ''
    }

    // Fetches recipient count + default picks, and the New Arrivals pool for
    // the drag-and-drop picker, together — same pool source as the Campaigns
    // drag-and-drop screen.
    async function loadAll() {
        setLoading(true)
        setPoolLoading(true)
        setLoadError('')
        try {
            const [previewRes, poolRes] = await Promise.all([
                fetch('/api/admin/whatsapp-campaign'),
                fetch('/api/admin/products?limit=200&sortBy=created_at&sortDir=desc', { headers: { 'x-admin-token': token() } }),
            ])
            const previewData = await previewRes.json()
            const poolData = await poolRes.json()
            if (!previewData.success) throw new Error(previewData.error || 'Failed to load preview')

            const all = Array.isArray(poolData.products) ? poolData.products : []
            const newArrivals = all.filter(isNewArrival).slice(0, POOL_LIMIT)
            setPool(newArrivals)

            setRecipientCount(previewData.recipientCount || 0)
            const defaultIds = previewData.defaultProductIds || []
            setSelected(defaultIds.map((id) => newArrivals.find((p) => p.id === id)).filter(Boolean))
        } catch (err) {
            setLoadError(err.message)
            setPool([])
        }
        setLoading(false)
        setPoolLoading(false)
    }

    function addSelected(product) {
        setSelected((prev) => {
            if (prev.length >= MAX_PRODUCTS || prev.some((p) => p.id === product.id)) return prev
            return [...prev, product]
        })
    }

    function removeSelected(productId) {
        setSelected((prev) => prev.filter((p) => p.id !== productId))
    }

    function handlePoolDragStart(product) {
        dragRef.current = product
    }

    function handleDragOver(e) {
        e.preventDefault()
    }

    function handleDrop() {
        const product = dragRef.current
        dragRef.current = null
        if (product) addSelected(product)
    }

    async function sendBatches(productLines, testNumbers) {
        let offset = 0
        let totals = { processed: 0, sent: 0, failed: 0 }
        let allErrors = []

        while (true) {
            const res = await fetch('/api/admin/whatsapp-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testNumbers ? { productLines, testNumbers } : { offset, limit: BATCH_SIZE, productLines }),
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'Send failed')

            totals = {
                processed: totals.processed + data.processed,
                sent: totals.sent + data.sent,
                failed: totals.failed + data.failed,
            }
            if (data.errors?.length) allErrors = [...allErrors, ...data.errors].slice(0, 10)

            if (!testNumbers) { setProgress(totals); setErrors(allErrors) }
            if (data.done) break
            offset += BATCH_SIZE
        }

        return { totals, allErrors }
    }

    async function sendTest() {
        const numbers = parseTestNumbers(testNumbersInput)
        if (numbers.length === 0) { alert('Enter at least one phone number first.'); return }
        if (selected.length === 0) { alert('Pick at least one product first.'); return }

        setTestSending(true)
        setTestResult(null)
        try {
            const { totals } = await sendBatches(buildProductLines(selected), numbers)
            setTestResult(totals)
        } catch (err) {
            setTestResult({ error: err.message })
        }
        setTestSending(false)
    }

    async function launchCampaign() {
        if (sending) return
        if (selected.length === 0) { alert('Pick at least one product first.'); return }
        if (!window.confirm('Send this broadcast to all ' + recipientCount + ' customers on WhatsApp, in batches of ' + BATCH_SIZE + '? This cannot be undone.')) return

        setSending(true)
        setFinished(false)
        setErrors([])
        setProgress({ processed: 0, sent: 0, failed: 0 })

        try {
            await sendBatches(buildProductLines(selected))
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

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">New Arrivals (drag into selection below)</p>
                    <p className="text-xs text-gray-500 mb-4">
                        Newest first · drag up to {MAX_PRODUCTS} cards down into "Selected for this broadcast" —
                        these become the product links in the <code className="bg-cream px-1.5 py-0.5 rounded">new_arrivals_broadcast_kt</code> message.
                    </p>

                    {poolLoading && <p className="text-sm text-gray-400">Loading...</p>}
                    {!poolLoading && pool.length === 0 && <p className="text-sm text-gray-400">No New Arrivals products found.</p>}
                    {!poolLoading && pool.length > 0 && (
                        <>
                        <button onClick={loadAll} disabled={sending} className="text-xs text-coral hover:underline mb-2 disabled:opacity-40">↻ Refresh pool</button>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {pool.map((product) => {
                                const alreadyIn = selected.some((p) => p.id === product.id)
                                const image = firstImage(product)
                                return (
                                    <div key={product.id}
                                         draggable={!alreadyIn}
                                         onDragStart={() => handlePoolDragStart(product)}
                                         onClick={() => addSelected(product)}
                                         className={'flex-shrink-0 w-36 border-2 rounded-xl p-2 select-none ' + (alreadyIn ? 'border-gray-100 opacity-40 cursor-not-allowed' : 'border-gray-100 hover:border-coral/40 cursor-grab active:cursor-grabbing')}>
                                        {image && (
                                            <img src={'/api/image?src=' + encodeURIComponent(image)} alt="" className="w-full aspect-square object-cover rounded-lg mb-1 pointer-events-none" />
                                        )}
                                        <p className="text-xs text-charcoal line-clamp-2">{product.title}</p>
                                        <p className="text-[10px] text-gray-400">{alreadyIn ? 'Already selected' : 'Drag or tap to add'}</p>
                                    </div>
                                )
                            })}
                        </div>
                        </>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">Selected for this broadcast ({selected.length}/{MAX_PRODUCTS})</p>
                    <p className="text-xs text-gray-500 mb-4">This is exactly what recipients will see, link and all.</p>

                    <div onDragOver={handleDragOver} onDrop={handleDrop}
                         className="space-y-2 min-h-[70px] border-2 border-dashed border-gray-200 rounded-xl p-3">
                        {selected.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-3">Drop New Arrivals cards here</p>
                        )}
                        {buildProductLines(selected).map((line, i) => (
                            <div key={i} className="flex items-center gap-3 bg-cream rounded-xl px-3 py-2">
                                {selected[i] && firstImage(selected[i]) && (
                                    <img src={'/api/image?src=' + encodeURIComponent(firstImage(selected[i]))} alt="" className="w-8 h-8 object-cover rounded-lg flex-shrink-0" />
                                )}
                                <p className="text-sm text-charcoal flex-1 min-w-0 truncate">{line}</p>
                                {selected[i] && (
                                    <button onClick={() => removeSelected(selected[i].id)} className="text-xs text-gray-300 hover:text-coral px-1 flex-shrink-0">✕</button>
                                )}
                            </div>
                        ))}
                    </div>
                    {loadError && <p className="text-sm text-red-500 mt-2">{loadError}</p>}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">Send a test first</p>
                    <p className="text-xs text-gray-500 mb-3">Enter one or more phone numbers (comma or newline separated) to try the message before it goes to every customer.</p>
                    <textarea value={testNumbersInput} onChange={(e) => setTestNumbersInput(e.target.value)}
                              placeholder="e.g. 03001234567, 03211234567" rows={2}
                              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm mb-3" />
                    <button onClick={sendTest} disabled={testSending || selected.length === 0}
                            className="px-5 py-2.5 border-2 border-charcoal text-charcoal font-display text-sm rounded-full hover:bg-charcoal hover:text-white transition-all disabled:opacity-40">
                        {testSending ? 'Sending test...' : 'Send Test'}
                    </button>
                    {testResult && (
                        testResult.error
                            ? <p className="text-sm text-red-500 mt-3">{testResult.error}</p>
                            : <p className="text-sm text-charcoal mt-3">
                                <span className="text-green-600 font-semibold">{testResult.sent} sent</span>
                                {testResult.failed > 0 && <span className="text-red-500 font-semibold"> · {testResult.failed} failed</span>}
                              </p>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">Recipients</p>
                    <p className="text-sm text-gray-500 mb-4">
                        {loading ? 'Loading...' : recipientCount.toLocaleString() + ' customers have a WhatsApp number on file — sent in batches of ' + BATCH_SIZE + '.'}
                    </p>

                    <button onClick={launchCampaign} disabled={sending || loading || recipientCount === 0 || selected.length === 0}
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
