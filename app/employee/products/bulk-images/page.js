'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const MONOCHROME_BG_COLORS = ['transparent', '#000000', '#1f2937', '#374151', '#6b7280', '#9ca3af', '#ffffff']
const STANDARD_BG_COLORS = ['#991b1b', '#7c7a00', '#166534', '#0f766e', '#1d4ed8', '#6b21a8', '#ea580c', '#ec4899']

function getEditorPreviewBackgroundStyle(color) {
    if (String(color || '').trim().toLowerCase() === 'transparent') {
        return {
            backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            backgroundColor: '#ffffff',
        }
    }
    return { background: color }
}

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
    const [imageEditor, setImageEditor] = useState({
        open: false,
        productId: null,
        index: null,
        rotate: 0,
        flipHorizontal: false,
        flipVertical: false,
        fit: 'contain',
        background: '#ffffff',
        saving: false,
    })
    const router = useRouter()
    const fileInputRefs = useRef({})

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token') || ''
            if (!token) {
                const employee = localStorage.getItem('employee')
                if (!employee) { router.push('/admin'); return }
                setVerified(true)
                return
            }
            try {
                const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await readApiJson(res)
                if (!data.valid) {
                    localStorage.removeItem('admin_token')
                    const employee = localStorage.getItem('employee')
                    if (!employee) { router.push('/admin'); return }
                    setVerified(true)
                }
                else setVerified(true)
            } catch {
                const employee = localStorage.getItem('employee')
                if (!employee) { router.push('/admin'); return }
                setVerified(true)
            }
        }
        verify()
    }, [])

    useEffect(() => { if (verified) loadProducts() }, [verified, page])

    async function loadProducts() {
        setLoading(true)
        const token = localStorage.getItem('admin_token') || ''
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

    function openImageEditor(productId, idx) {
        const p = products.find(x => x.id === productId)
        if (!p || !p._images[idx]) return
        setImageEditor({
            open: true,
            productId,
            index: idx,
            rotate: 0,
            flipHorizontal: false,
            flipVertical: false,
            fit: 'contain',
            background: '#ffffff',
            saving: false,
        })
    }

    function closeImageEditor() {
        setImageEditor(prev => ({ ...prev, open: false, saving: false }))
    }

    async function applyImageEdit() {
        const { productId, index } = imageEditor
        if (!productId || index === null) return
        const p = products.find(x => x.id === productId)
        const imageUrl = p?._images?.[index]
        if (!imageUrl) return

        const key = `${productId}_${imageUrl}`
        setRotating(r => ({ ...r, [key]: true }))
        setImageEditor(prev => ({ ...prev, saving: true }))
        const token = localStorage.getItem('admin_token') || ''
        try {
            const res = await fetch('/api/admin/edit-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                body: JSON.stringify({
                    url: imageUrl,
                    rotate: imageEditor.rotate,
                    flipHorizontal: imageEditor.flipHorizontal,
                    flipVertical: imageEditor.flipVertical,
                    fit: imageEditor.fit,
                    background: imageEditor.background,
                }),
            })
            const data = await readApiJson(res)
            if (data.success && data.url) {
                const next = p._images.map((u, i) => i === index ? data.url : u)
                updateProductImages(productId, next)
                closeImageEditor()
            } else {
                alert('Image edit failed: ' + (data.error || 'Unknown error'))
            }
        } catch (err) {
            alert('Image edit error: ' + err.message)
        }
        setRotating(r => { const n = { ...r }; delete n[key]; return n })
        setImageEditor(prev => ({ ...prev, saving: false }))
    }

    async function uploadNewImage(productId, file) {
        setUploading(u => ({ ...u, [productId]: true }))
        const formData = new FormData()
        formData.append('file', file)
        const token = localStorage.getItem('admin_token') || ''
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
        const token = localStorage.getItem('admin_token') || ''
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
                    <Link href="/employee/products" className="text-gray-400 hover:text-coral text-sm">← Products</Link>
                    <h1 className="font-display text-xl text-charcoal">Bulk Image Editor</h1>
                    <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{total} products</span>
                </div>
                <p className="text-xs text-gray-400">Edit in large panel · Reorder/remove quickly · Save per product</p>
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
                                        <div className="grid grid-cols-2 gap-2">
                                            {product._images.map((imgUrl, idx) => {
                                                const rotKey = `${product.id}_${imgUrl}`
                                                const isRotating = rotating[rotKey]
                                                return (
                                                    <div key={idx} className="rounded-lg border border-gray-100 p-2 bg-gray-50">
                                                        <div className="relative aspect-square">
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
                                                        </div>
                                                        <div className="mt-2 grid grid-cols-2 gap-1">
                                                            <button
                                                                onClick={() => openImageEditor(product.id, idx)}
                                                                disabled={isRotating}
                                                                className="col-span-2 px-2 py-1.5 bg-charcoal text-white text-xs rounded hover:bg-charcoal/90 disabled:opacity-50"
                                                            >
                                                                Edit Image
                                                            </button>
                                                            {idx > 0 && (
                                                                <button
                                                                    onClick={() => moveImage(product.id, idx, -1)}
                                                                    className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100"
                                                                >
                                                                    Move Left
                                                                </button>
                                                            )}
                                                            {idx < product._images.length - 1 && (
                                                                <button
                                                                    onClick={() => moveImage(product.id, idx, 1)}
                                                                    className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100"
                                                                >
                                                                    Move Right
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => removeImage(product.id, idx)}
                                                                className="col-span-2 px-2 py-1 bg-red-50 text-red-600 text-xs rounded hover:bg-red-100"
                                                            >
                                                                Remove
                                                            </button>
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

            {imageEditor.open && imageEditor.productId && imageEditor.index !== null && (() => {
                const product = products.find(p => p.id === imageEditor.productId)
                const imageUrl = product?._images?.[imageEditor.index]
                if (!imageUrl) return null
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60" onClick={closeImageEditor} />
                        <div className="relative bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-5">
                            <div className="lg:col-span-3 bg-gray-100 p-4 flex items-center justify-center">
                                <div
                                    className="w-full max-w-2xl aspect-square rounded-xl overflow-hidden border border-gray-200"
                                    style={imageEditor.fit === 'contain' ? getEditorPreviewBackgroundStyle(imageEditor.background) : { background: '#f3f4f6' }}
                                >
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className={`w-full h-full ${imageEditor.fit === 'contain' ? 'object-contain' : 'object-cover'}`}
                                        style={{
                                            transform: `rotate(${imageEditor.rotate}deg) scaleX(${imageEditor.flipHorizontal ? -1 : 1}) scaleY(${imageEditor.flipVertical ? -1 : 1})`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="lg:col-span-2 p-5 overflow-y-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-display text-lg text-charcoal">Edit Image</h3>
                                    <button type="button" onClick={closeImageEditor} className="text-gray-400 hover:text-charcoal">✕</button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500">Rotation ({Math.round(imageEditor.rotate)}°)</label>
                                        <input
                                            type="range"
                                            min="-180"
                                            max="180"
                                            value={imageEditor.rotate}
                                            onChange={e => setImageEditor(prev => ({ ...prev, rotate: Number(e.target.value) }))}
                                            className="w-full mt-1"
                                        />
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                            <button type="button" onClick={() => setImageEditor(prev => ({ ...prev, rotate: prev.rotate - 90 }))} className="px-2 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">-90°</button>
                                            <button type="button" onClick={() => setImageEditor(prev => ({ ...prev, rotate: 0 }))} className="px-2 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">Reset</button>
                                            <button type="button" onClick={() => setImageEditor(prev => ({ ...prev, rotate: prev.rotate + 90 }))} className="px-2 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">+90°</button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setImageEditor(prev => ({ ...prev, flipHorizontal: !prev.flipHorizontal }))}
                                            className={`px-3 py-2 text-xs rounded-lg ${imageEditor.flipHorizontal ? 'bg-charcoal text-white' : 'bg-gray-100 text-charcoal hover:bg-gray-200'}`}
                                        >
                                            Flip Horizontal
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setImageEditor(prev => ({ ...prev, flipVertical: !prev.flipVertical }))}
                                            className={`px-3 py-2 text-xs rounded-lg ${imageEditor.flipVertical ? 'bg-charcoal text-white' : 'bg-gray-100 text-charcoal hover:bg-gray-200'}`}
                                        >
                                            Flip Vertical
                                        </button>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-gray-500">Fit</label>
                                        <select
                                            value={imageEditor.fit}
                                            onChange={e => setImageEditor(prev => ({ ...prev, fit: e.target.value }))}
                                            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral"
                                        >
                                            <option value="cover">Cover (fill frame)</option>
                                            <option value="contain">Contain (pad to square)</option>
                                        </select>
                                    </div>

                                    {imageEditor.fit === 'contain' && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500">Background Color</label>
                                            <div className="mt-2 space-y-3">
                                                <div>
                                                    <p className="text-[11px] font-semibold text-gray-500 mb-1">Monochrome</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {MONOCHROME_BG_COLORS.map((color) => (
                                                            <button
                                                                key={color}
                                                                type="button"
                                                                onClick={() => setImageEditor(prev => ({ ...prev, background: color }))}
                                                                title={color}
                                                                className={'w-8 h-8 rounded-lg border-2 ' + (imageEditor.background === color ? 'border-coral' : 'border-gray-200')}
                                                                style={color === 'transparent' ? getEditorPreviewBackgroundStyle(color) : { background: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-[11px] font-semibold text-gray-500 mb-1">Standard Colors</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {STANDARD_BG_COLORS.map((color) => (
                                                            <button
                                                                key={color}
                                                                type="button"
                                                                onClick={() => setImageEditor(prev => ({ ...prev, background: color }))}
                                                                title={color}
                                                                className={'w-8 h-8 rounded-lg border-2 ' + (imageEditor.background === color ? 'border-coral' : 'border-gray-200')}
                                                                style={{ background: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                <p className="text-[11px] font-semibold text-gray-500">Custom</p>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <input
                                                    type="color"
                                                    value={imageEditor.background === 'transparent' ? '#ffffff' : imageEditor.background}
                                                    onChange={e => setImageEditor(prev => ({ ...prev, background: e.target.value }))}
                                                    className="h-10 w-14 rounded border border-gray-200"
                                                />
                                                <input
                                                    type="text"
                                                    value={imageEditor.background}
                                                    onChange={e => setImageEditor(prev => ({ ...prev, background: e.target.value }))}
                                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <a
                                        href="https://www.remove.bg/upload"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block w-full text-center px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600"
                                    >
                                        Remove Background ↗
                                    </a>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-5">
                                    <button
                                        type="button"
                                        onClick={applyImageEdit}
                                        disabled={imageEditor.saving}
                                        className="px-4 py-2 bg-coral text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-60"
                                    >
                                        {imageEditor.saving ? 'Applying...' : 'Apply Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeImageEditor}
                                        className="px-4 py-2 bg-gray-200 text-charcoal text-sm font-semibold rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}
