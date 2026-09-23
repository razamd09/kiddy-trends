'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPortalNav from '@/components/AdminPortalNav'

const MAX_PRODUCTS = 10
const POOL_LIMIT = 100
const SITE_URL = 'https://thekiddytrends.com'
const BATCH_SIZE_MIN = 5
const BATCH_SIZE_MAX = 20
const RECIPIENTS_PAGE_SIZE = 30

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

function formatPrice(value) {
    return Math.round(Number(value) || 0).toLocaleString()
}

// One card per selected product (image + short text + a button pointing at
// that product), padded to MAX_PRODUCTS with a generic "more new arrivals"
// card using the site logo — every card in an approved carousel template
// must always be sent, so a short selection still needs a real image per slot.
function buildCards(selected) {
    const cards = selected.map((p) => ({
        id: String(p.id),
        image: SITE_URL + '/api/image?src=' + encodeURIComponent(firstImage(p) || ''),
        bodyText: cleanTitle(p.title) + ' – PKR ' + formatPrice(p.price),
        buttonPath: 'products/prd_id=' + p.id,
    }))
    let fillerCount = 0
    while (cards.length < MAX_PRODUCTS) {
        fillerCount += 1
        cards.push({
            id: 'filler-' + fillerCount,
            image: SITE_URL + '/logo.jpg',
            bodyText: '✨ More new arrivals at Kiddy Trends',
            buttonPath: 'collections',
        })
    }
    return cards
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

    const [loadError, setLoadError] = useState('')

    const [pool, setPool] = useState([])
    const [poolLoading, setPoolLoading] = useState(true)
    const [selected, setSelected] = useState([])

    const [testNumbersInput, setTestNumbersInput] = useState('')
    const [debugTemplateName, setDebugTemplateName] = useState('')
    const [testSending, setTestSending] = useState(false)
    const [testResult, setTestResult] = useState(null)

    // Recipient picker — mirrors the Customers page's search/sort/filter.
    // 'eligible' = selectable now, 'sent' = read-only history of everyone
    // ever sent a campaign (regardless of whether their cooldown expired).
    const [recipientsTab, setRecipientsTab] = useState('eligible')
    const [recipients, setRecipients] = useState([])
    const [recipientsLoading, setRecipientsLoading] = useState(true)
    const [recipientsPage, setRecipientsPage] = useState(1)
    const [recipientsTotal, setRecipientsTotal] = useState(0)
    const [recipientsQuery, setRecipientsQuery] = useState('')
    const [recipientsSort, setRecipientsSort] = useState('')
    const [recipientsDir, setRecipientsDir] = useState('desc')
    const [recipientsSource, setRecipientsSource] = useState('')
    const [cooldownDays, setCooldownDays] = useState(5)
    const [selectedCustomers, setSelectedCustomers] = useState(new Map())
    const [batchSize, setBatchSize] = useState(10)

    const [sending, setSending] = useState(false)
    const [sendTotal, setSendTotal] = useState(0)
    const [progress, setProgress] = useState({ processed: 0, sent: 0, failed: 0, skippedCooldown: 0 })
    const [errors, setErrors] = useState([])
    const [finished, setFinished] = useState(false)

    const [debugInfo, setDebugInfo] = useState(null)
    const [debugLoading, setDebugLoading] = useState(false)
    const [showDebug, setShowDebug] = useState(false)

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

    useEffect(() => {
        if (!verified) return
        loadRecipients(recipientsPage)
    }, [verified, recipientsPage, recipientsSort, recipientsDir, recipientsSource, recipientsTab])

    function token() {
        return localStorage.getItem('admin_token') || ''
    }

    // Fetches default picks, and the New Arrivals pool for the drag-and-drop
    // picker, together — same pool source as the Campaigns drag-and-drop screen.
    async function loadAll() {
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

            const defaultIds = previewData.defaultProductIds || []
            setSelected(defaultIds.map((id) => newArrivals.find((p) => p.id === id)).filter(Boolean))
        } catch (err) {
            setLoadError(err.message)
            setPool([])
        }
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

    function isOnCooldown(customer) {
        if (!customer.last_campaign_sent_at) return false
        const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000
        return Date.now() - new Date(customer.last_campaign_sent_at).getTime() < cooldownMs
    }

    function cooldownUntilLabel(customer) {
        const sentAt = new Date(customer.last_campaign_sent_at).getTime()
        const eligibleAt = new Date(sentAt + cooldownDays * 24 * 60 * 60 * 1000)
        return eligibleAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    }

    function sentAtLabel(customer) {
        return new Date(customer.last_campaign_sent_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    }

    async function loadRecipients(page) {
        setRecipientsLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), dir: recipientsDir, tab: recipientsTab })
            if (recipientsSort) params.set('sort', recipientsSort)
            if (recipientsQuery.trim()) params.set('q', recipientsQuery.trim())
            if (recipientsSource) params.set('source', recipientsSource)

            const res = await fetch('/api/admin/whatsapp-campaign/recipients?' + params.toString(), {
                headers: { 'x-admin-token': token() },
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'Failed to load customers')

            setRecipients(data.customers || [])
            setRecipientsTotal(data.total || 0)
            if (data.cooldownDays) setCooldownDays(data.cooldownDays)
        } catch {
            setRecipients([])
        }
        setRecipientsLoading(false)
    }

    function switchRecipientsTab(tab) {
        if (tab === recipientsTab) return
        setRecipientsTab(tab)
        setRecipientsSort('')
        setRecipientsPage(1)
    }

    function submitRecipientSearch(e) {
        e.preventDefault()
        setRecipientsPage(1)
        loadRecipients(1)
    }

    function toggleRecipientSort(column) {
        setRecipientsPage(1)
        if (recipientsSort === column) {
            setRecipientsDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        } else {
            setRecipientsSort(column)
            setRecipientsDir('asc')
        }
    }

    function sortArrow(column) {
        if (recipientsSort !== column) return ''
        return recipientsDir === 'asc' ? ' ▲' : ' ▼'
    }

    function toggleSelectCustomer(customer) {
        if (isOnCooldown(customer)) return
        setSelectedCustomers((prev) => {
            const next = new Map(prev)
            if (next.has(customer.id)) next.delete(customer.id)
            else next.set(customer.id, customer)
            return next
        })
    }

    function selectAllEligibleOnPage() {
        setSelectedCustomers((prev) => {
            const next = new Map(prev)
            recipients.forEach((c) => { if (!isOnCooldown(c)) next.set(c.id, c) })
            return next
        })
    }

    function clearSelection() {
        setSelectedCustomers(new Map())
    }

    async function loadDebugInfo() {
        setDebugLoading(true)
        try {
            const res = await fetch('/api/admin/whatsapp-campaign/status-log')
            const data = await res.json()
            setDebugInfo(data)
        } catch {
            setDebugInfo(null)
        }
        setDebugLoading(false)
    }

    function toggleDebug() {
        const next = !showDebug
        setShowDebug(next)
        if (next) loadDebugInfo()
    }

    // Uploads every card's image to WhatsApp once — the resulting media ids
    // are reused for every recipient in the send loop below, instead of
    // re-uploading per batch or per customer.
    async function uploadCardMedia(cards) {
        const res = await fetch('/api/admin/whatsapp-campaign/upload-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: cards.map((c) => ({ id: c.id, url: c.image })) }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Media upload failed')

        const failed = data.results.filter((r) => !r.success)
        if (failed.length > 0) throw new Error('Image upload failed for ' + failed.length + ' card(s): ' + failed[0].error)

        const mediaById = Object.fromEntries(data.results.map((r) => [r.id, r.mediaId]))
        return cards.map((c) => ({ ...c, mediaId: mediaById[c.id] }))
    }

    function cardsToPayload(cardsWithMedia) {
        return cardsWithMedia.map((c) => ({ mediaId: c.mediaId, bodyText: c.bodyText, buttonPath: c.buttonPath }))
    }

    async function sendOneBatch(cardsPayload, { customerIds, testNumbers, debugTemplateName } = {}) {
        const res = await fetch('/api/admin/whatsapp-campaign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testNumbers
                ? { cards: cardsPayload, testNumbers, debugTemplateName: debugTemplateName || undefined }
                : { cards: cardsPayload, customerIds }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Send failed')
        return data
    }

    function chunkArray(array, size) {
        const chunks = []
        for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size))
        return chunks
    }

    async function sendTest() {
        const numbers = parseTestNumbers(testNumbersInput)
        if (numbers.length === 0) { alert('Enter at least one phone number first.'); return }
        if (!debugTemplateName && selected.length === 0) { alert('Pick at least one product first.'); return }

        setTestSending(true)
        setTestResult(null)
        try {
            const cardsWithMedia = debugTemplateName ? [] : await uploadCardMedia(buildCards(selected))
            const data = await sendOneBatch(cardsToPayload(cardsWithMedia), { testNumbers: numbers, debugTemplateName })
            setTestResult({ processed: data.processed, sent: data.sent, failed: data.failed, details: data.errors })
        } catch (err) {
            setTestResult({ error: err.message })
        }
        setTestSending(false)
    }

    async function launchCampaign() {
        if (sending) return
        const customers = [...selectedCustomers.values()]
        if (selected.length === 0) { alert('Pick at least one product first.'); return }
        if (customers.length === 0) { alert('Select at least one customer to send to.'); return }
        if (!window.confirm('Send this broadcast to ' + customers.length + ' selected customer(s), in batches of ' + batchSize + '? This cannot be undone.')) return

        setSending(true)
        setFinished(false)
        setErrors([])
        setSendTotal(customers.length)
        setProgress({ processed: 0, sent: 0, failed: 0, skippedCooldown: 0 })

        try {
            const cardsWithMedia = await uploadCardMedia(buildCards(selected))
            const cardsPayload = cardsToPayload(cardsWithMedia)
            const batches = chunkArray(customers.map((c) => c.id), batchSize)

            let totals = { processed: 0, sent: 0, failed: 0, skippedCooldown: 0 }
            let allErrors = []

            for (const batchIds of batches) {
                const data = await sendOneBatch(cardsPayload, { customerIds: batchIds })
                totals = {
                    processed: totals.processed + data.processed,
                    sent: totals.sent + data.sent,
                    failed: totals.failed + data.failed,
                    skippedCooldown: totals.skippedCooldown + (data.skippedCooldown || 0),
                }
                if (data.errors?.length) allErrors = [...allErrors, ...data.errors].slice(0, 10)
                setProgress(totals)
                setErrors(allErrors)
            }

            clearSelection()
            loadRecipients(recipientsPage)
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
                <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-400">New Arrivals campaign · sent to every customer's WhatsApp</p>
                    <button onClick={toggleDebug} className="text-xs text-coral hover:underline flex-shrink-0">
                        {showDebug ? 'Hide troubleshooting' : 'Troubleshoot'}
                    </button>
                </div>
            </div>
            <AdminPortalNav />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {showDebug && (
                    <div className="bg-white rounded-2xl shadow-sm p-5 text-sm">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-display text-base text-charcoal">Delivery status log</p>
                            <button onClick={loadDebugInfo} disabled={debugLoading} className="text-xs text-coral hover:underline disabled:opacity-40">↻ Refresh</button>
                        </div>
                        {debugLoading && <p className="text-gray-400">Loading...</p>}
                        {!debugLoading && debugInfo && (
                            <div className="space-y-3">
                                <p className="text-xs text-gray-500">{debugInfo.totalEvents} status events ever received from WhatsApp's delivery webhook.</p>
                                {debugInfo.totalEvents === 0 ? (
                                    <p className="text-orange-500 text-xs bg-orange-50 rounded-xl p-3">
                                        Zero status events ever recorded — the delivery-status webhook likely isn't configured
                                        in Meta yet (WhatsApp Manager → Configuration → Webhooks, subscribe to "messages" field
                                        with this same callback URL), so we have no visibility into what happens after a send
                                        is accepted.
                                    </p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {debugInfo.recent.map((e) => (
                                            <div key={e.id} className="bg-cream rounded-lg p-2 text-xs">
                                                <span className={e.status === 'failed' ? 'text-red-500 font-semibold' : e.status === '_webhook_received' ? 'text-gray-400 font-semibold' : 'text-green-600 font-semibold'}>
                                                    {e.status || '—'}
                                                </span>
                                                <span className="text-gray-400 ml-2">{new Date(e.received_at).toLocaleString()}</span>
                                                {e.wa_message_id && <p className="text-gray-500 mt-0.5">msg: {e.wa_message_id}</p>}
                                                {e.error_message && <p className="text-red-500 mt-0.5">{e.error_title}: {e.error_message}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">New Arrivals (drag into selection below)</p>
                    <p className="text-xs text-gray-500 mb-4">
                        Newest first · drag up to {MAX_PRODUCTS} cards down into "Selected for this broadcast" —
                        these become the carousel cards in the <code className="bg-cream px-1.5 py-0.5 rounded">new_arrivals_carousel_kt_10</code> message.
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
                    <p className="text-xs text-gray-500 mb-4">This is exactly what each carousel card will show — image, price line, and a "View Product" button.</p>

                    <div onDragOver={handleDragOver} onDrop={handleDrop}
                         className="space-y-2 min-h-[70px] border-2 border-dashed border-gray-200 rounded-xl p-3">
                        {selected.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-3">Drop New Arrivals cards here</p>
                        )}
                        {buildCards(selected).map((card, i) => (
                            <div key={card.id} className="flex items-center gap-3 bg-cream rounded-xl px-3 py-2">
                                <img src={card.image} alt="" className="w-8 h-8 object-cover rounded-lg flex-shrink-0" />
                                <p className="text-sm text-charcoal flex-1 min-w-0 truncate">{card.bodyText}</p>
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
                        {testSending ? 'Uploading images & sending...' : 'Send Test'}
                    </button>
                    {testResult && (
                        testResult.error
                            ? <p className="text-sm text-red-500 mt-3">{testResult.error}</p>
                            : <div className="mt-3">
                                <p className="text-sm text-charcoal">
                                    <span className="text-green-600 font-semibold">{testResult.sent} sent</span>
                                    {testResult.failed > 0 && <span className="text-red-500 font-semibold"> · {testResult.failed} failed</span>}
                                </p>
                                {testResult.details?.length > 0 && (
                                    <div className="mt-1 text-xs text-red-500 space-y-0.5">
                                        {testResult.details.map((e, i) => <p key={i}>{e}</p>)}
                                    </div>
                                )}
                              </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">Recipients</p>
                    <p className="text-xs text-gray-500 mb-4">
                        Pick which customers to send to. Anyone messaged in the last {cooldownDays} days can't be selected again until their cooldown ends.
                    </p>

                    <div className="flex gap-2 mb-4 border-b border-gray-100">
                        <button type="button" onClick={() => switchRecipientsTab('eligible')}
                                className={'px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ' + (recipientsTab === 'eligible' ? 'border-coral text-coral' : 'border-transparent text-gray-400 hover:text-charcoal')}>
                            Eligible to Send
                        </button>
                        <button type="button" onClick={() => switchRecipientsTab('sent')}
                                className={'px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ' + (recipientsTab === 'sent' ? 'border-coral text-coral' : 'border-transparent text-gray-400 hover:text-charcoal')}>
                            Already Sent
                        </button>
                    </div>

                    <form onSubmit={submitRecipientSearch} className="flex flex-col sm:flex-row gap-2 mb-3">
                        <input value={recipientsQuery} onChange={(e) => setRecipientsQuery(e.target.value)}
                               placeholder="Search by name or phone"
                               className="flex-1 rounded-xl border-2 border-gray-100 px-3 py-2 text-sm outline-none focus:border-coral" />
                        <select value={recipientsSource} onChange={(e) => { setRecipientsSource(e.target.value); setRecipientsPage(1) }}
                                className="rounded-xl border-2 border-gray-100 px-3 py-2 text-sm bg-white sm:w-44">
                            <option value="">All Sources</option>
                            <option value="Website">Website</option>
                            <option value="Insta">Instagram</option>
                            <option value="Whatsapp">WhatsApp</option>
                            <option value="Facebook">Facebook</option>
                        </select>
                        <button type="submit" className="px-4 py-2 rounded-xl bg-charcoal text-white text-sm font-semibold hover:opacity-90">Search</button>
                    </form>

                    {recipientsTab === 'eligible' && (
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex gap-3">
                                <button type="button" onClick={selectAllEligibleOnPage} className="text-xs text-coral hover:underline">Select all on this page</button>
                                <button type="button" onClick={clearSelection} className="text-xs text-gray-400 hover:text-coral">Clear selection</button>
                            </div>
                            <p className="text-xs font-semibold text-charcoal">{selectedCustomers.size} selected</p>
                        </div>
                    )}

                    <div className="border-2 border-gray-100 rounded-xl overflow-hidden mb-3">
                        {recipientsLoading ? (
                            <div className="p-6 text-sm text-gray-400">Loading customers...</div>
                        ) : recipients.length === 0 ? (
                            <div className="p-6 text-sm text-gray-400 text-center">
                                {recipientsTab === 'eligible' ? 'No eligible customers found' : 'No campaign messages sent yet'}
                            </div>
                        ) : (
                            <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-cream text-gray-500 sticky top-0">
                                        <tr>
                                            {recipientsTab === 'eligible' && <th className="px-3 py-2 w-8"></th>}
                                            <th className="text-left px-3 py-2 font-semibold">
                                                <button onClick={() => toggleRecipientSort('name')} className="hover:text-coral">Name{sortArrow('name')}</button>
                                            </th>
                                            <th className="text-left px-3 py-2 font-semibold">
                                                <button onClick={() => toggleRecipientSort('phone')} className="hover:text-coral">Phone{sortArrow('phone')}</button>
                                            </th>
                                            <th className="text-left px-3 py-2 font-semibold">
                                                <button onClick={() => toggleRecipientSort('last_sent')} className="hover:text-coral">Last Messaged{sortArrow('last_sent')}</button>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recipients.map((c) => {
                                            const onCooldown = isOnCooldown(c)
                                            const checked = selectedCustomers.has(c.id)
                                            const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || '-'
                                            return (
                                                <tr key={c.id} className="border-t border-gray-100">
                                                    {recipientsTab === 'eligible' && (
                                                        <td className="px-3 py-2">
                                                            <input type="checkbox" checked={checked} onChange={() => toggleSelectCustomer(c)} />
                                                        </td>
                                                    )}
                                                    <td className="px-3 py-2 font-medium text-charcoal">{name}</td>
                                                    <td className="px-3 py-2 text-charcoal whitespace-nowrap">{c.phone}</td>
                                                    <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">
                                                        {!c.last_campaign_sent_at
                                                            ? 'Never messaged'
                                                            : onCooldown
                                                                ? 'Cooldown until ' + cooldownUntilLabel(c)
                                                                : 'Eligible again (last sent ' + sentAtLabel(c) + ')'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-gray-500">
                            Page {recipientsPage} of {Math.max(1, Math.ceil(recipientsTotal / RECIPIENTS_PAGE_SIZE))} · {recipientsTotal} customers with a WhatsApp number
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setRecipientsPage((p) => Math.max(1, p - 1))} disabled={recipientsPage <= 1}
                                    className="px-3 py-1.5 rounded-xl bg-cream text-xs disabled:opacity-40">Prev</button>
                            <button onClick={() => setRecipientsPage((p) => p + 1)} disabled={recipientsPage >= Math.ceil(recipientsTotal / RECIPIENTS_PAGE_SIZE)}
                                    className="px-3 py-1.5 rounded-xl bg-cream text-xs disabled:opacity-40">Next</button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs text-gray-500 mb-1">Batch size ({BATCH_SIZE_MIN}-{BATCH_SIZE_MAX} customers per request)</label>
                        <input type="number" min={BATCH_SIZE_MIN} max={BATCH_SIZE_MAX} value={batchSize}
                               onChange={(e) => setBatchSize(Math.min(BATCH_SIZE_MAX, Math.max(BATCH_SIZE_MIN, Number(e.target.value) || BATCH_SIZE_MIN)))}
                               className="w-28 rounded-xl border-2 border-gray-100 px-3 py-2 text-sm" />
                    </div>

                    <button onClick={launchCampaign} disabled={sending || selectedCustomers.size === 0 || selected.length === 0}
                            className="px-6 py-3 bg-coral text-white font-display text-sm rounded-full hover:bg-opacity-90 disabled:opacity-50">
                        {sending ? 'Uploading images & sending...' : '🚀 Send to Selected (' + selectedCustomers.size + ')'}
                    </button>

                    {(sending || finished) && (
                        <div className="mt-5">
                            <div className="w-full bg-cream rounded-full h-2 mb-2 overflow-hidden">
                                <div className="bg-coral h-2 transition-all"
                                     style={{ width: (sendTotal ? (progress.processed / sendTotal) * 100 : 0) + '%' }} />
                            </div>
                            <p className="text-sm text-charcoal">
                                {progress.processed} / {sendTotal} processed ·
                                <span className="text-green-600 font-semibold"> {progress.sent} sent</span>
                                {progress.failed > 0 && <span className="text-red-500 font-semibold"> · {progress.failed} failed</span>}
                                {progress.skippedCooldown > 0 && <span className="text-orange-500 font-semibold"> · {progress.skippedCooldown} skipped (cooldown)</span>}
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
