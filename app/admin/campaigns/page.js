'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPortalNav from '@/components/AdminPortalNav'

const CAMPAIGNS = [1, 2, 3]
const POOL_LIMIT = 150

function isNewArrival(product) {
    return String(product?.product_version || '').trim().toLowerCase().includes('new arrival')
}

function firstImage(product) {
    const images = product?.images
    if (!Array.isArray(images) || images.length === 0) return null
    const first = images[0]
    return typeof first === 'string' ? first : (first?.src || null)
}

export default function AdminCampaignsPage() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()
    const [activeCampaign, setActiveCampaign] = useState(1)

    const [itemsByCampaign, setItemsByCampaign] = useState({ 1: [], 2: [], 3: [] })
    const [loadedCampaigns, setLoadedCampaigns] = useState({})
    const [dirtyCampaigns, setDirtyCampaigns] = useState({})
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [pool, setPool] = useState([])
    const [poolLoading, setPoolLoading] = useState(true)
    const dragRef = useRef(null)

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
            try {
                const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await res.json()
                if (!data.valid) { localStorage.removeItem('admin_token'); router.push('/admin'); return }
                setVerified(true)
                fetchPool()
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

    // Only fetch a campaign the first time its tab is opened — refetching on
    // every tab switch would silently overwrite a drag-reorder that hasn't
    // been saved with "Apply Changes" yet.
    useEffect(() => {
        if (verified && !loadedCampaigns[activeCampaign]) fetchCampaign(activeCampaign)
    }, [verified, activeCampaign])

    async function readJson(res) {
        const text = await res.text()
        if (!text) return {}
        try { return JSON.parse(text) } catch { return { success: false, error: text } }
    }

    function token() {
        return localStorage.getItem('admin_token') || ''
    }

    // A larger batch fetched newest-first, then filtered down to New
    // Arrivals client-side — the shared products API doesn't have a
    // product_version filter param, and this keeps the admin route untouched.
    async function fetchPool() {
        setPoolLoading(true)
        try {
            const res = await fetch('/api/admin/products?limit=300&sortBy=created_at&sortDir=desc', { headers: { 'x-admin-token': token() } })
            const data = await readJson(res)
            const all = Array.isArray(data.products) ? data.products : []
            setPool(all.filter(isNewArrival).slice(0, POOL_LIMIT))
        } catch {
            setPool([])
        }
        setPoolLoading(false)
    }

    async function fetchCampaign(campaignNumber) {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/campaign-slots?campaign=' + campaignNumber, { headers: { 'x-admin-token': token() } })
            const data = await readJson(res)
            setItemsByCampaign((prev) => ({ ...prev, [campaignNumber]: Array.isArray(data.items) ? data.items : [] }))
        } catch {
            setItemsByCampaign((prev) => ({ ...prev, [campaignNumber]: [] }))
        }
        setLoadedCampaigns((prev) => ({ ...prev, [campaignNumber]: true }))
        setLoading(false)
    }

    async function persistOrder(campaignNumber, items) {
        setSaving(true)
        try {
            await fetch('/api/admin/campaign-slots', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token() },
                body: JSON.stringify({ campaign_number: campaignNumber, product_ids: items.map((it) => it.productId) }),
            })
            setDirtyCampaigns((prev) => ({ ...prev, [campaignNumber]: false }))
        } catch {}
        setSaving(false)
    }

    function markDirty(campaignNumber) {
        setDirtyCampaigns((prev) => ({ ...prev, [campaignNumber]: true }))
    }

    function applyChanges() {
        persistOrder(activeCampaign, itemsByCampaign[activeCampaign] || [])
    }

    async function addProductAtPosition(product, position) {
        const current = itemsByCampaign[activeCampaign] || []
        if (current.some((it) => it.productId === product.id)) return

        const newItem = {
            productId: product.id,
            title: product.title,
            image: firstImage(product),
            price: product.price,
            isActive: product.is_active !== false,
        }
        const next = [...current]
        next.splice(Math.max(0, Math.min(position, next.length)), 0, newItem)
        setItemsByCampaign((prev) => ({ ...prev, [activeCampaign]: next }))

        try {
            const res = await fetch('/api/admin/campaign-slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token() },
                body: JSON.stringify({ campaign_number: activeCampaign, product_id: product.id }),
            })
            const data = await readJson(res)
            if (!res.ok || !data.success) {
                alert(data.error || 'Failed to add product')
                fetchCampaign(activeCampaign)
                return
            }
            // Slot is created server-side (appended at the end); the exact
            // drop position is only local until "Apply Changes" persists it.
            markDirty(activeCampaign)
        } catch (err) {
            alert(err.message)
            fetchCampaign(activeCampaign)
        }
    }

    function handlePoolDragStart(product) {
        dragRef.current = { type: 'pool', product }
    }

    function handleExistingDragStart(index) {
        dragRef.current = { type: 'existing', index }
    }

    function handleDragOver(e) {
        e.preventDefault()
    }

    function handleDropOnRow(targetIndex) {
        const drag = dragRef.current
        dragRef.current = null
        if (!drag) return

        if (drag.type === 'pool') {
            addProductAtPosition(drag.product, targetIndex)
            return
        }

        if (drag.type === 'existing' && drag.index !== targetIndex) {
            setItemsByCampaign((prev) => {
                const current = [...(prev[activeCampaign] || [])]
                const [moved] = current.splice(drag.index, 1)
                current.splice(targetIndex, 0, moved)
                return { ...prev, [activeCampaign]: current }
            })
            markDirty(activeCampaign)
        }
    }

    function handleDropAtEnd() {
        const drag = dragRef.current
        dragRef.current = null
        if (!drag) return

        const current = itemsByCampaign[activeCampaign] || []
        if (drag.type === 'pool') {
            addProductAtPosition(drag.product, current.length)
            return
        }
        if (drag.type === 'existing') {
            setItemsByCampaign((prev) => {
                const list = [...(prev[activeCampaign] || [])]
                const [moved] = list.splice(drag.index, 1)
                list.push(moved)
                return { ...prev, [activeCampaign]: list }
            })
            markDirty(activeCampaign)
        }
    }

    async function removeProduct(productId) {
        if (!window.confirm('Remove this product from Campaign ' + activeCampaign + '?')) return
        try {
            await fetch('/api/admin/campaign-slots?campaign=' + activeCampaign + '&product_id=' + productId, {
                method: 'DELETE',
                headers: { 'x-admin-token': token() },
            })
            setItemsByCampaign((prev) => ({ ...prev, [activeCampaign]: prev[activeCampaign].filter((it) => it.productId !== productId) }))
        } catch {}
    }

    if (!verified) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
            </div>
        )
    }

    const currentItems = itemsByCampaign[activeCampaign] || []
    const pinnedIds = new Set(currentItems.map((it) => it.productId))

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Campaigns</h1>
                    {saving && <span className="text-xs text-gray-400">Saving...</span>}
                </div>
                <p className="text-xs text-gray-400">/campaign1, /campaign2, /campaign3 — one fixed URL per ad campaign</p>
            </div>
            <AdminPortalNav />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-2 mb-6">
                    {CAMPAIGNS.map((num) => (
                        <button key={num} onClick={() => setActiveCampaign(num)}
                                className={'px-6 py-2.5 rounded-full font-display text-sm transition-colors ' + (activeCampaign === num ? 'bg-coral text-white' : 'bg-white text-charcoal border-2 border-gray-100 hover:border-coral/40')}>
                            Campaign {num}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                    <p className="font-display text-lg text-charcoal mb-1">New Arrivals (drag into position below)</p>
                    <p className="text-xs text-gray-500 mb-4">Newest first · drag any card down into the "Campaign {activeCampaign} — display order" list to pin it exactly where you drop it.</p>

                    {poolLoading && <p className="text-sm text-gray-400">Loading...</p>}
                    {!poolLoading && pool.length === 0 && <p className="text-sm text-gray-400">No New Arrivals products found.</p>}
                    {!poolLoading && pool.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {pool.map((product) => {
                                const alreadyIn = pinnedIds.has(product.id)
                                const image = firstImage(product)
                                return (
                                    <div key={product.id}
                                         draggable={!alreadyIn}
                                         onDragStart={() => handlePoolDragStart(product)}
                                         className={'flex-shrink-0 w-36 border-2 rounded-xl p-2 select-none ' + (alreadyIn ? 'border-gray-100 opacity-40 cursor-not-allowed' : 'border-gray-100 hover:border-coral/40 cursor-grab active:cursor-grabbing')}>
                                        {image && (
                                            <img src={'/api/image?src=' + encodeURIComponent(image)} alt="" className="w-full aspect-square object-cover rounded-lg mb-1 pointer-events-none" />
                                        )}
                                        <p className="text-xs text-charcoal line-clamp-2">{product.title}</p>
                                        <p className="text-[10px] text-gray-400">{alreadyIn ? 'Already pinned' : 'Drag to pin'}</p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-1">
                        <p className="font-display text-lg text-charcoal">Campaign {activeCampaign} — display order</p>
                        <button onClick={applyChanges} disabled={saving || !dirtyCampaigns[activeCampaign]}
                                className="flex-shrink-0 px-5 py-2 bg-coral text-white font-display text-sm rounded-full hover:bg-opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                            {saving ? 'Applying...' : dirtyCampaigns[activeCampaign] ? 'Apply Changes' : 'Applied'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                        Drag rows to reorder, or drop a New Arrivals card from above — reordering is instant on screen but only goes live on /campaign{activeCampaign} once you click "Apply Changes".
                        {dirtyCampaigns[activeCampaign] && !saving && <span className="text-orange-500 font-semibold"> Unsaved changes.</span>}
                    </p>

                    {loading && <p className="text-sm text-gray-400">Loading...</p>}
                    {!loading && (
                        <div className="space-y-2" onDragOver={handleDragOver} onDrop={handleDropAtEnd}>
                            {currentItems.length === 0 && (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
                                    Drop a product here to pin it to Campaign {activeCampaign}
                                </div>
                            )}
                            {currentItems.map((item, index) => (
                                <div key={item.productId}
                                     draggable
                                     onDragStart={() => handleExistingDragStart(index)}
                                     onDragOver={handleDragOver}
                                     onDrop={(e) => { e.stopPropagation(); handleDropOnRow(index) }}
                                     className="flex items-center gap-3 border-2 border-gray-100 rounded-xl p-2 cursor-move hover:border-coral/40 bg-white">
                                    <span className="text-gray-300 text-lg px-1">⠿</span>
                                    <span className="w-6 text-xs text-gray-400 font-bold">{index + 1}</span>
                                    {item.image && (
                                        <img src={'/api/image?src=' + encodeURIComponent(item.image)} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-charcoal truncate">{item.title}</p>
                                        <p className="text-xs text-gray-400">PKR {item.price?.toLocaleString?.() || item.price} {!item.isActive && <span className="text-orange-500 font-semibold ml-1">(Draft)</span>}</p>
                                    </div>
                                    <button onClick={() => removeProduct(item.productId)}
                                            className="text-xs text-gray-300 hover:text-coral px-2">✕ Remove</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
