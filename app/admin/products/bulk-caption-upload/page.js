'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPortalNav from '@/components/AdminPortalNav'

const DEFAULT_CATEGORY_OPTIONS = ['Clothing', 'Bedding', 'Bags', 'Accessories', 'Footwear', 'Toys', 'Shoes', 'Other']
const DEFAULT_PRODUCT_VERSION_OPTIONS = ['new arrivals', 'Old Packs']
const DEFAULT_PRODUCT_TYPE_OPTIONS = ['T-Shirt', 'Full Sleeves Shirt', 'Shorts', 'Denim Jeans', 'Trouser', 'Girl-Top', 'Frock', 'Socks', 'Jacket', 'Button Shirts', 'Jeans Shorts', 'Cargo Pents', 'Cargo Trousers', 'School Bags', 'Ladies Bags', 'Bag-Pack', 'Rompers', 'Kurta Trouser', 'Girls Kurti with Gharara', 'Girls Kurti with Trouser', 'Mock Necks']
const DEFAULT_FABRIC_OPTIONS = ['Cotton', 'Terry', 'Jersy', 'Fleece', 'Silk Cotton', 'Silk', 'Denim']
const DEFAULT_COLOR_OPTIONS = [
    'Black', 'White', 'Red', 'Blue', 'Navy Blue', 'Royal Blue', 'Light Blue', 'Green', 'Dark Green', 'Light Green',
    'Pink', 'Light Pink', 'Purple', 'Lavender', 'Yellow', 'Mustard', 'Orange', 'Peach', 'Grey', 'Light Grey', 'Silver',
    'Beige', 'Brown', 'Tan', 'Navy', 'Teal', 'Aqua', 'Maroon', 'Gold', 'Cream', 'Multi-color', 'Multi Color'
]
const GENDER_OPTIONS = ['Girls', 'Boys', 'Neutral']
const ANALYZE_CONCURRENCY = 3
const UPLOAD_CONCURRENCY = 4

function buildYearlyVariants(ageStart, ageEnd, price, qty) {
    const variants = []
    for (let y = ageStart; y < ageEnd; y++) {
        variants.push({
            option1_name: 'Size',
            option1_value: y + '-' + (y + 1) + ' Year',
            option2_name: '', option2_value: '',
            option3_name: '', option3_value: '',
            price, inventory_qty: qty, sku: '',
        })
    }
    return variants
}

async function runWithConcurrency(items, limit, worker) {
    let idx = 0
    async function next() {
        while (idx < items.length) {
            const current = idx++
            await worker(items[current], current)
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next))
}

export default function BulkCaptionUploadPage() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()

    const [items, setItems] = useState([])
    const [analyzing, setAnalyzing] = useState(false)
    const [running, setRunning] = useState(false)
    const [doneCount, setDoneCount] = useState(0)

    const [productTypeOptions, setProductTypeOptions] = useState(DEFAULT_PRODUCT_TYPE_OPTIONS)
    const [productVersionOptions, setProductVersionOptions] = useState(DEFAULT_PRODUCT_VERSION_OPTIONS)
    const [fabricOptions, setFabricOptions] = useState(DEFAULT_FABRIC_OPTIONS)
    const [categoryOptions, setCategoryOptions] = useState(DEFAULT_CATEGORY_OPTIONS)
    const [seasonOptions, setSeasonOptions] = useState([])
    const [brandOptions, setBrandOptions] = useState([])

    const [batch, setBatch] = useState({
        title_prefix: '',
        gender: 'Neutral',
        product_type: '',
        product_version: 'new arrivals',
        category: 'Clothing',
        color: '',
        brand_id: '',
        product_season_id: '',
        fallback_price: '',
        fallback_fabric: '',
        quantity_per_item: '1',
        tags: '',
        status: 'draft',
    })

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
            try {
                const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await res.json()
                if (!data.valid) { localStorage.removeItem('admin_token'); router.push('/admin'); return }
                setVerified(true)
                fetchMetadata()
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

    async function readJson(res) {
        const text = await res.text()
        if (!text) return {}
        try { return JSON.parse(text) } catch { return { success: false, error: text } }
    }

    async function fetchOptions(path, key, fallback) {
        const token = localStorage.getItem('admin_token') || ''
        try {
            const res = await fetch(path, { headers: { 'x-admin-token': token } })
            const data = await readJson(res)
            const next = Array.isArray(data?.[key]) ? data[key].map((i) => String(i?.name || '').trim()).filter(Boolean) : []
            return res.ok && next.length > 0 ? next : fallback
        } catch {
            return fallback
        }
    }

    async function fetchMetadata() {
        const token = localStorage.getItem('admin_token') || ''
        const [types, versions, fabrics, categories, seasonsRes, brandsRes] = await Promise.all([
            fetchOptions('/api/admin/product-types', 'types', DEFAULT_PRODUCT_TYPE_OPTIONS),
            fetchOptions('/api/admin/product-versions', 'versions', DEFAULT_PRODUCT_VERSION_OPTIONS),
            fetchOptions('/api/admin/product-fabrics', 'fabrics', DEFAULT_FABRIC_OPTIONS),
            fetchOptions('/api/admin/product-categories', 'categories', DEFAULT_CATEGORY_OPTIONS),
            fetch('/api/admin/product-seasons', { headers: { 'x-admin-token': token } }).then(readJson).catch(() => ({})),
            fetch('/api/admin/product-brands', { headers: { 'x-admin-token': token } }).then(readJson).catch(() => ({})),
        ])
        setProductTypeOptions(types)
        setProductVersionOptions(versions)
        setFabricOptions(fabrics)
        setCategoryOptions(categories)
        setSeasonOptions(Array.isArray(seasonsRes?.seasons) ? seasonsRes.seasons : [])
        setBrandOptions(Array.isArray(brandsRes?.brands) ? brandsRes.brands : [])
    }

    function updateItem(id, patch) {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
    }

    function removeItem(id) {
        setItems((prev) => prev.filter((it) => it.id !== id))
    }

    async function handleFileSelect(e) {
        const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
        const nextItems = files.map((file, idx) => ({
            id: String(Date.now()) + '_' + idx,
            file,
            previewUrl: URL.createObjectURL(file),
            ageStart: '', ageEnd: '', price: '', fabric: '',
            status: 'pending',
            error: '',
        }))
        setItems(nextItems)
        setDoneCount(0)
        e.target.value = ''

        setAnalyzing(true)
        await runWithConcurrency(nextItems, ANALYZE_CONCURRENCY, async (item) => {
            updateItem(item.id, { status: 'analyzing' })
            try {
                const formData = new FormData()
                formData.append('file', item.file)
                const res = await fetch('/api/admin/analyze-caption', { method: 'POST', body: formData })
                const data = await readJson(res)
                if (!res.ok || !data.success) throw new Error(data.error || 'Caption analysis failed')
                updateItem(item.id, {
                    status: 'analyzed',
                    ageStart: data.ageStart ?? '',
                    ageEnd: data.ageEnd ?? '',
                    price: data.price ?? '',
                    fabric: data.fabric || '',
                })
            } catch (err) {
                updateItem(item.id, { status: 'analyzed', error: 'OCR: ' + err.message })
            }
        })
        setAnalyzing(false)
    }

    function validateBatch() {
        if (!batch.product_type) return 'Product Type is required.'
        if (!batch.product_version) return 'Product Version is required.'
        if (!batch.product_season_id) return 'Product Season is required.'
        if (!batch.color) return 'Color is required.'
        if (!batch.brand_id) return 'Brand is required.'
        if (items.length === 0) return 'Select caption images first.'
        for (const it of items) {
            const ageStart = parseInt(it.ageStart, 10)
            const ageEnd = parseInt(it.ageEnd, 10)
            if (!Number.isFinite(ageStart) || !Number.isFinite(ageEnd) || ageEnd <= ageStart) {
                return 'Some images have no valid age range detected — fill Age Start/End manually on highlighted rows.'
            }
            const price = parseFloat(it.price) || parseFloat(batch.fallback_price)
            if (!price || price <= 0) {
                return 'Some images have no price detected and no fallback price set — fill one or the other.'
            }
            const fabric = it.fabric || batch.fallback_fabric
            if (!fabric) {
                return 'Some images have no fabric detected and no fallback fabric set — fill one or the other.'
            }
        }
        return ''
    }

    function rowIsIncomplete(it) {
        const ageStart = parseInt(it.ageStart, 10)
        const ageEnd = parseInt(it.ageEnd, 10)
        const validAge = Number.isFinite(ageStart) && Number.isFinite(ageEnd) && ageEnd > ageStart
        const validPrice = (parseFloat(it.price) || parseFloat(batch.fallback_price)) > 0
        const validFabric = Boolean(it.fabric || batch.fallback_fabric)
        return !validAge || !validPrice || !validFabric
    }

    async function startUpload() {
        const error = validateBatch()
        if (error) { alert(error); return }
        if (!window.confirm('Create ' + items.length + ' products (' + batch.status + ') from these images?')) return

        setRunning(true)
        setDoneCount(0)
        const token = localStorage.getItem('admin_token') || ''
        const tags = batch.tags.split(',').map((t) => t.trim()).filter(Boolean)
        let sequence = 0

        await runWithConcurrency(items, UPLOAD_CONCURRENCY, async (item) => {
            updateItem(item.id, { status: 'uploading' })
            try {
                const formData = new FormData()
                formData.append('file', item.file)
                const uploadRes = await fetch('/api/admin/upload-image', { method: 'POST', body: formData })
                const uploadData = await readJson(uploadRes)
                if (!uploadRes.ok || !uploadData.success || !uploadData.url) {
                    throw new Error(uploadData.error || 'Image upload failed')
                }

                const ageStart = parseInt(item.ageStart, 10)
                const ageEnd = parseInt(item.ageEnd, 10)
                const price = parseFloat(item.price) || parseFloat(batch.fallback_price) || 0
                const fabric = item.fabric || batch.fallback_fabric
                const qty = parseInt(batch.quantity_per_item) || 1
                const variants = buildYearlyVariants(ageStart, ageEnd, price, qty)

                sequence += 1
                const seq = String(sequence).padStart(3, '0')
                const title = (batch.title_prefix.trim() || batch.product_type) + ' – ' + batch.gender + ' – ' + ageStart + '-' + ageEnd + ' Year #' + seq

                const payload = {
                    title,
                    description: '',
                    price,
                    compare_price: 0,
                    category: batch.category,
                    product_type: batch.product_type,
                    fabric,
                    color: batch.color,
                    gender: batch.gender,
                    tags,
                    stock: variants.reduce((sum, v) => sum + v.inventory_qty, 0),
                    images: [uploadData.url],
                    variants,
                    product_version: batch.product_version,
                    product_season_id: Number(batch.product_season_id),
                    character_id: null,
                    brand_id: Number(batch.brand_id),
                    status: batch.status,
                    is_active: batch.status === 'active',
                }

                const productRes = await fetch('/api/admin/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                    body: JSON.stringify(payload),
                })
                const productData = await readJson(productRes)
                if (!productRes.ok || !productData.success) {
                    throw new Error(productData.error || 'Product create failed')
                }

                updateItem(item.id, { status: 'done' })
            } catch (err) {
                updateItem(item.id, { status: 'failed', error: err.message })
            } finally {
                setDoneCount((c) => c + 1)
            }
        })

        setRunning(false)
    }

    if (!verified) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
            </div>
        )
    }

    const failedCount = items.filter((it) => it.status === 'failed').length
    const doneOkCount = items.filter((it) => it.status === 'done').length

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/admin/products" className="text-gray-400 hover:text-coral text-sm">← Products</Link>
                    <h1 className="font-display text-xl text-charcoal">Bulk Caption Upload</h1>
                    {items.length > 0 && (
                        <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{items.length} images</span>
                    )}
                </div>
                <p className="text-xs text-gray-400">Reads age range, price & fabric printed on each photo · one image = one product with a full size range</p>
            </div>
            <AdminPortalNav />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Step 1: image picker */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">1. Select caption images</p>
                    <p className="text-xs text-gray-500 mb-4">
                        Pick photos that have a printed caption like "1-10 YEARS · 1750/- ONLY". Each photo is read automatically to detect its age range, price, and fabric.
                        Free OCR isn't perfect — always check the detected values below before uploading.
                    </p>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="block text-sm text-charcoal file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-coral file:text-white file:font-display hover:file:bg-opacity-90"
                    />
                    {analyzing && <p className="text-xs text-blue-500 mt-3">Reading captions...</p>}
                </div>

                {/* Step 2: batch settings */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">2. Batch settings</p>
                    <p className="text-xs text-gray-500 mb-4">Age range/price/fabric come from each photo's caption — everything else here is set once for the whole batch. Fallback price/fabric are used only if a photo's caption couldn't be read.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Title Prefix (optional)</label>
                            <input value={batch.title_prefix} onChange={(e) => setBatch((p) => ({ ...p, title_prefix: e.target.value }))}
                                   placeholder="Defaults to Product Type" className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Gender *</label>
                            <select value={batch.gender} onChange={(e) => setBatch((p) => ({ ...p, gender: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Product Type *</label>
                            <select value={batch.product_type} onChange={(e) => setBatch((p) => ({ ...p, product_type: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                <option value="">Select...</option>
                                {productTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Product Version *</label>
                            <select value={batch.product_version} onChange={(e) => setBatch((p) => ({ ...p, product_version: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                {productVersionOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Category</label>
                            <select value={batch.category} onChange={(e) => setBatch((p) => ({ ...p, category: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Color *</label>
                            <select value={batch.color} onChange={(e) => setBatch((p) => ({ ...p, color: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                <option value="">Select...</option>
                                {DEFAULT_COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Brand *</label>
                            <select value={batch.brand_id} onChange={(e) => setBatch((p) => ({ ...p, brand_id: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                <option value="">Select...</option>
                                {brandOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Season *</label>
                            <select value={batch.product_season_id} onChange={(e) => setBatch((p) => ({ ...p, product_season_id: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                <option value="">Select...</option>
                                {seasonOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Fallback Price (PKR)</label>
                            <input type="number" value={batch.fallback_price} onChange={(e) => setBatch((p) => ({ ...p, fallback_price: e.target.value }))}
                                   className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Fallback Fabric</label>
                            <select value={batch.fallback_fabric} onChange={(e) => setBatch((p) => ({ ...p, fallback_fabric: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                <option value="">None</option>
                                {fabricOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Quantity per size</label>
                            <input type="number" min="1" value={batch.quantity_per_item} onChange={(e) => setBatch((p) => ({ ...p, quantity_per_item: e.target.value }))}
                                   className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Tags (comma separated, optional)</label>
                            <input value={batch.tags} onChange={(e) => setBatch((p) => ({ ...p, tags: e.target.value }))}
                                   className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Status</label>
                            <select value={batch.status} onChange={(e) => setBatch((p) => ({ ...p, status: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                <option value="draft">Draft (review before going live)</option>
                                <option value="active">Active (live immediately)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Step 3: preview + run */}
                {items.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <p className="font-display text-lg text-charcoal">3. Review & Upload ({items.length} images)</p>
                            <button onClick={startUpload} disabled={running || analyzing}
                                    className="px-6 py-2.5 bg-coral text-white font-display text-sm rounded-full hover:bg-opacity-90 disabled:opacity-50">
                                {running ? 'Uploading ' + doneCount + '/' + items.length + '...' : 'Start Upload'}
                            </button>
                        </div>

                        {running && (
                            <div className="w-full bg-cream rounded-full h-2 mb-4 overflow-hidden">
                                <div className="bg-coral h-2 transition-all" style={{ width: (items.length ? (doneCount / items.length) * 100 : 0) + '%' }} />
                            </div>
                        )}

                        {!running && doneCount > 0 && (
                            <p className="text-sm mb-4">
                                <span className="text-green-600 font-semibold">{doneOkCount} created</span>
                                {failedCount > 0 && <span className="text-red-500 font-semibold ml-3">{failedCount} failed</span>}
                            </p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[700px] overflow-y-auto">
                            {items.map((item) => (
                                <div key={item.id} className={'rounded-xl border-2 p-3 relative flex gap-3 ' + (rowIsIncomplete(item) && item.status !== 'uploading' ? 'border-orange-300 bg-orange-50' : 'border-gray-100')}>
                                    {(item.status === 'pending' || item.status === 'analyzed') && !running && (
                                        <button onClick={() => removeItem(item.id)}
                                                className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full text-xs text-gray-400 hover:text-coral shadow z-10">✕</button>
                                    )}
                                    <img src={item.previewUrl} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex gap-1">
                                            <input type="number" value={item.ageStart} onChange={(e) => updateItem(item.id, { ageStart: e.target.value })}
                                                   placeholder="From" disabled={running}
                                                   className="w-1/2 text-xs border border-gray-200 rounded px-1.5 py-1" />
                                            <input type="number" value={item.ageEnd} onChange={(e) => updateItem(item.id, { ageEnd: e.target.value })}
                                                   placeholder="To (Year)" disabled={running}
                                                   className="w-1/2 text-xs border border-gray-200 rounded px-1.5 py-1" />
                                        </div>
                                        <input type="number" value={item.price} onChange={(e) => updateItem(item.id, { price: e.target.value })}
                                               placeholder="Price" disabled={running}
                                               className="w-full text-xs border border-gray-200 rounded px-1.5 py-1" />
                                        <select value={item.fabric} onChange={(e) => updateItem(item.id, { fabric: e.target.value })}
                                                disabled={running}
                                                className="w-full text-xs border border-gray-200 rounded px-1.5 py-1">
                                            <option value="">Fabric (fallback)</option>
                                            {fabricOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                        {item.status === 'analyzing' && <p className="text-[10px] text-blue-500">Reading caption...</p>}
                                        {item.status === 'uploading' && <p className="text-[10px] text-blue-500">Uploading...</p>}
                                        {item.status === 'done' && <p className="text-[10px] text-green-600">✓ Created</p>}
                                        {item.status === 'failed' && <p className="text-[10px] text-red-500" title={item.error}>✕ {item.error}</p>}
                                        {item.error && item.status === 'analyzed' && <p className="text-[10px] text-orange-500" title={item.error}>⚠ {item.error}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
