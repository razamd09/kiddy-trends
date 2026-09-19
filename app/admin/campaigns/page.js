'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPortalNav from '@/components/AdminPortalNav'

const CAMPAIGNS = [1, 2, 3]

export default function AdminCampaignsPage() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()
    const [activeCampaign, setActiveCampaign] = useState(1)

    const [itemsByCampaign, setItemsByCampaign] = useState({ 1: [], 2: [], 3: [] })
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const dragIndexRef = useRef(null)

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
        if (verified) fetchCampaign(activeCampaign)
    }, [verified, activeCampaign])

    async function readJson(res) {
        const text = await res.text()
        if (!text) return {}
        try { return JSON.parse(text) } catch { return { success: false, error: text } }
    }

    function token() {
        return localStorage.getItem('admin_token') || ''
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
        } catch {}
        setSaving(false)
    }

    function handleDragStart(index) {
        dragIndexRef.current = index
    }

    function handleDragOver(e) {
        e.preventDefault()
    }

    function handleDrop(index) {
        const fromIndex = dragIndexRef.current
        dragIndexRef.current = null
        if (fromIndex === null || fromIndex === index) return

        setItemsByCampaign((prev) => {
            const current = [...(prev[activeCampaign] || [])]
            const [moved] = current.splice(fromIndex, 1)
            current.splice(index, 0, moved)
            persistOrder(activeCampaign, current)
            return { ...prev, [activeCampaign]: current }
        })
    }

    async function handleSearch(e) {
        e.preventDefault()
        const term = search.trim()
        if (!term) { setSearchResults([]); return }
        setSearching(true)
        try {
            const res = await fetch('/api/admin/products?search=' + encodeURIComponent(term) + '&limit=10', { headers: { 'x-admin-token': token() } })
            const data = await readJson(res)
            setSearchResults(Array.isArray(data.products) ? data.products : [])
        } catch {
            setSearchResults([])
        }
        setSearching(false)
    }

    async function addProduct(product) {
        const currentItems = itemsByCampaign[activeCampaign] || []
        if (currentItems.some((it) => it.productId === product.id)) return
        try {
            const res = await fetch('/api/admin/campaign-slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token() },
                body: JSON.stringify({ campaign_number: activeCampaign, product_id: product.id }),
            })
            const data = await readJson(res)
            if (!res.ok || !data.success) { alert(data.error || 'Failed to add product'); return }
            fetchCampaign(activeCampaign)
        } catch (err) {
            alert(err.message)
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

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-2 mb-6">
                    {CAMPAIGNS.map((num) => (
                        <button key={num} onClick={() => setActiveCampaign(num)}
                                className={'px-6 py-2.5 rounded-full font-display text-sm transition-colors ' + (activeCampaign === num ? 'bg-coral text-white' : 'bg-white text-charcoal border-2 border-gray-100 hover:border-coral/40')}>
                            Campaign {num}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                    <p className="font-display text-lg text-charcoal mb-1">Add a product to Campaign {activeCampaign}</p>
                    <p className="text-xs text-gray-500 mb-4">Search by title, then click to pin it to the end of the list — drag it into position afterwards.</p>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product title..."
                               className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2 text-sm" />
                        <button type="submit" disabled={searching}
                                className="px-6 py-2 bg-charcoal text-white font-display text-sm rounded-full hover:bg-opacity-90 disabled:opacity-50">
                            {searching ? 'Searching...' : 'Search'}
                        </button>
                    </form>
                    {searchResults.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            {searchResults.map((product) => {
                                const alreadyIn = currentItems.some((it) => it.productId === product.id)
                                const image = Array.isArray(product.images) && product.images.length > 0
                                    ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.src)
                                    : null
                                return (
                                    <button key={product.id} onClick={() => addProduct(product)} disabled={alreadyIn}
                                            className={'text-left border-2 rounded-xl p-2 transition-colors ' + (alreadyIn ? 'border-gray-100 opacity-50 cursor-not-allowed' : 'border-gray-100 hover:border-coral/40')}>
                                        {image && <img src={'/api/image?src=' + encodeURIComponent(image)} alt="" className="w-full aspect-square object-cover rounded-lg mb-1" />}
                                        <p className="text-xs text-charcoal line-clamp-2">{product.title}</p>
                                        <p className="text-[10px] text-coral font-semibold">{alreadyIn ? 'Already pinned' : '+ Add'}</p>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">Campaign {activeCampaign} — display order</p>
                    <p className="text-xs text-gray-500 mb-4">Drag rows to reorder. This is exactly the order shown at the top of /campaign{activeCampaign}.</p>

                    {loading && <p className="text-sm text-gray-400">Loading...</p>}
                    {!loading && currentItems.length === 0 && (
                        <p className="text-sm text-gray-400">No products pinned to this campaign yet — search above to add some.</p>
                    )}
                    {!loading && currentItems.length > 0 && (
                        <div className="space-y-2">
                            {currentItems.map((item, index) => (
                                <div key={item.productId}
                                     draggable
                                     onDragStart={() => handleDragStart(index)}
                                     onDragOver={handleDragOver}
                                     onDrop={() => handleDrop(index)}
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
