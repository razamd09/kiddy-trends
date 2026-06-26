'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

async function readApiJson(res) {
    const text = await res.text()
    if (!text) return {}
    try { return JSON.parse(text) } catch { return { success: false, error: text } }
}

function normalizeImages(images) {
    if (Array.isArray(images)) return images.map(img => typeof img === 'string' ? img : img?.src).filter(Boolean)
    if (typeof images === 'string') {
        const t = images.trim()
        if (!t) return []
        try {
            const p = JSON.parse(t)
            if (Array.isArray(p)) return p.map(img => typeof img === 'string' ? img : img?.src).filter(Boolean)
        } catch {}
        if (t.includes('\n')) return t.split('\n').map(s => s.trim()).filter(Boolean)
        return [t]
    }
    return []
}

export default function BulkImagesPage() {
    const [verified, setVerified] = useState(false)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [saving, setSaving] = useState({})
    const [rotating, setRotating] = useState({})
    const [uploading, setUploading] = useState({})
    const [savedMsg, setSavedMsg] = useState({})
    const router = useRouter()
    const fileInputRefs = useRef({})

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
            try {
                const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await readApiJson(res)
                if (!data.valid) { localStorage.removeItem('admin_token'); router.push('/admin') }
                else setVerified(true)
            } catch { router.push('/admin') }
        }
        verify()
    }, [])

    useEffect(() => { if (verified) loadProducts() }, [verified, page])

    async function loadProducts() {
        setLoading(true)
        const token = localStorage.getItem('admin_token')
        const res = await fetch(`/api/admin/products?page=${page}&limit=12`, { headers: { 'x-admin-token': token } })
        const data = await readApiJson(res)
        if (data.success) {
            setProducts((data.products || []).map(p => ({
                ...p,
                _images: normalizeImages(p.images),
            })))
            setTotal(data.total || 0)
        }
        setLoading(false)
    }

    const filtered = products.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))

    function updateProductImages(productId, newImages) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, _images: newImages } : p))
    }

    function removeImage(productId, idx) {
        const p = products.find(x => x.id === productId)
        if (!p) return
        const next = p._images.filter((_, i) => i !== idx)
        updateProductImages(productId, next)
    }

    function moveImage(productId, idx, dir) {
        const p = products.find(x => x.id === productId)
        if (!p) return
        const imgs = [...p._images]
        const swap = idx + dir
        if (swap < 0 || swap >= imgs.length) return
        ;[imgs[idx], imgs[swap]] = [imgs[swap], imgs[idx]]
        updateProductImages(productId, imgs)
    }

    async function rotateImage(productId, imageUrl, degrees) {
        const key = `${productId}_${imageUrl}`
        setRotating(r => ({ ...r, [key]: true }))
        const token = localStorage.getItem('admin_token')
        try {
            const res = await fetch('/api/admin/rotate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                body: JSON.stringify({ url: imageUrl, degrees }),
            })
            const data = await readApiJson(res)
            if (data.success && data.url) {
                const p = products.find(x => x.id === productId)
                if (p) {
                    const next = p._images.map(u => u === imageUrl ? data.url : u)
                    updateProductImages(productId, next)
                }
            } else {
                alert('Rotation failed: ' + (data.error || 'Unknown error'))
            }
        } catch (err) {
            alert('Rotation error: ' + err.message)
        }
        setRotating(r => { const n = { ...r }; delete n[key]; return n })
    }

    async function uploadNewImage(productId, file) {
        setUploading(u => ({ ...u, [productId]: true }))
        const formData = new FormData()
        formData.append('file', file)
        const token = localStorage.getItem('admin_token')
        try {
            const res = await fetch('/api/admin/upload-image', { method: 'POST', headers: { 'x-admin-token': token }, body: formData })
            const data = await readApiJson(res)
            if (data.success && data.url) {
                const p = products.find(x => x.id === productId)
                if (p) updateProductImages(productId, [...p._images, data.url])
            } else {
                alert('Upload failed: ' + (data.error || 'Unknown'))
            }
        } catch (err) {
            alert('Upload error: ' + err.message)
        }
        setUploading(u => { const n = { ...u }; delete n[productId]; return n })
    }

    async function saveProductImages(productId) {
        const p = products.find(x => x.id === productId)
        if (!p) return
        setSaving(s => ({ ...s, [productId]: true }))
        const token = localStorage.getItem('admin_token')
        try {
            const res = await fetch('/api/admin/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                body: JSON.stringify({ id: productId, images: p._images }),
            })
            const data = await readApiJson(res)
            if (data.success) {
                setSavedMsg(m => ({ ...m, [productId]: true }))
                setTimeout(() => setSavedMsg(m => { const n = { ...m }; delete n[productId]; return n }), 2000)
            } else {
                alert('Save failed: ' + data.error)
            }
        } catch (err) {
            alert('Save error: ' + err.message)
        }
        setSaving(s => { const n = { ...s }; delete n[productId]; return n })
    }

    const maxPages = Math.ceil(total / 12)

    if (!verified) return (
        <div className="min-h-screen bg-cream flex items-center justify-center">
            <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/admin/products" className="text-gray-400 hover:text-coral text-sm">← Products</Link>
                    <h1 className="font-display text-xl text-charcoal">Bulk Image Editor</h1>
                    <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{total} products</span>
                </div>
                <p className="text-xs text-gray-400">Click images to manage · Drag to reorder · Save per product</p>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="🔍 Search products..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm"
                    />
                </div>

                {loading ? (
                    <div className="text-center py-16 text-gray-400 animate-pulse">Loading products...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(product => (
                            <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                {/* Product header */}
                                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-sm text-charcoal truncate max-w-[160px]">{product.title}</p>
                                        <p className="text-xs text-gray-400">{product._images.length} image{product._images.length !== 1 ? 's' : ''} · PKR {product.price?.toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {savedMsg[product.id] && (
                                            <span className="text-xs text-green-600 font-semibold">✅ Saved!</span>
                                        )}
                                        <button
                                            onClick={() => saveProductImages(product.id)}
                                            disabled={saving[product.id]}
                                            className="px-3 py-1.5 bg-coral text-white text-xs font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                                        >
                                            {saving[product.id] ? '...' : 'Save'}
                                        </button>
                                    </div>
                                </div>

                                {/* Images grid */}
                                <div className="p-3">
                                    {product._images.length === 0 ? (
                                        <div className="h-20 flex items-center justify-center text-gray-300 text-sm border-2 border-dashed rounded-xl">
                                            No images
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {product._images.map((imgUrl, idx) => {
                                                const rotKey = `${product.id}_${imgUrl}`
                                                const isRotating = rotating[rotKey]
                                                return (
                                                    <div key={idx} className="relative group aspect-square">
                                                        <img
                                                            src={imgUrl}
                                                            alt={`Image ${idx + 1}`}
                                                            className="w-full h-full object-cover rounded-lg"
                                                            onError={e => e.target.style.opacity = '0.3'}
                                                        />
                                                        {idx === 0 && (
                                                            <span className="absolute top-1 left-1 bg-coral text-white text-xs px-1 rounded font-bold">Main</span>
                                                        )}
                                                        {isRotating && (
                                                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                                                <span className="text-white text-xs">↻</span>
                                                            </div>
                                                        )}
                                                        {/* Controls overlay */}
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1">
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => rotateImage(product.id, imgUrl, -90)}
                                                                    disabled={isRotating}
                                                                    title="Rotate Left"
                                                                    className="bg-white/90 text-charcoal text-xs px-1.5 py-1 rounded hover:bg-white"
                                                                >↺</button>
                                                                <button
                                                                    onClick={() => rotateImage(product.id, imgUrl, 90)}
                                                                    disabled={isRotating}
                                                                    title="Rotate Right"
                                                                    className="bg-white/90 text-charcoal text-xs px-1.5 py-1 rounded hover:bg-white"
                                                                >↻</button>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                {idx > 0 && (
                                                                    <button
                                                                        onClick={() => moveImage(product.id, idx, -1)}
                                                                        title="Move left"
                                                                        className="bg-blue-500/90 text-white text-xs px-1.5 py-1 rounded hover:bg-blue-500"
                                                                    >←</button>
                                                                )}
                                                                {idx < product._images.length - 1 && (
                                                                    <button
                                                                        onClick={() => moveImage(product.id, idx, 1)}
                                                                        title="Move right"
                                                                        className="bg-blue-500/90 text-white text-xs px-1.5 py-1 rounded hover:bg-blue-500"
                                                                    >→</button>
                                                                )}
                                                                <button
                                                                    onClick={() => removeImage(product.id, idx)}
                                                                    title="Remove"
                                                                    className="bg-red-500/90 text-white text-xs px-1.5 py-1 rounded hover:bg-red-500"
                                                                >✕</button>
                                                            </div>
                                                            <a
                                                                href={`https://www.remove.bg/upload`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="bg-purple-500/90 text-white text-xs px-2 py-1 rounded hover:bg-purple-500"
                                                            >Remove BG ↗</a>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Add image */}
                                    <div className="mt-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={el => fileInputRefs.current[product.id] = el}
                                            className="hidden"
                                            onChange={e => {
                                                const f = e.target.files?.[0]
                                                if (f) uploadNewImage(product.id, f)
                                                e.target.value = ''
                                            }}
                                        />
                                        <button
                                            onClick={() => fileInputRefs.current[product.id]?.click()}
                                            disabled={uploading[product.id]}
                                            className="w-full py-2 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-xl hover:border-coral hover:text-coral disabled:opacity-50"
                                        >
                                            {uploading[product.id] ? 'Uploading...' : '+ Add Image'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {maxPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-3">
                        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                                className="px-4 py-2 text-sm bg-charcoal text-white rounded-xl disabled:opacity-50">← Prev</button>
                        <span className="text-sm font-semibold text-charcoal">Page {page} of {maxPages}</span>
                        <button onClick={() => setPage(Math.min(maxPages, page + 1))} disabled={page === maxPages}
                                className="px-4 py-2 text-sm bg-charcoal text-white rounded-xl disabled:opacity-50">Next →</button>
                    </div>
                )}
            </div>
        </div>
    )
}
