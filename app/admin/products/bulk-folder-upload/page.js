'use client'
import { useEffect, useRef, useState } from 'react'
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
const UPLOAD_CONCURRENCY = 4

function detectGender(folderName) {
    const s = String(folderName || '').toLowerCase()
    if (s.includes('girl')) return 'Girls'
    if (s.includes('boy')) return 'Boys'
    return 'Neutral'
}

function titleCase(text) {
    return String(text || '').trim().replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Takes each image's folder path and reads gender from its immediate parent
// folder and size/age from the folder above that, so the same picker works
// whether you select an age folder directly or a parent containing many age
// folders — no reconfiguration needed between batches.
function parseFile(file) {
    const relPath = file.webkitRelativePath || file.name
    const parts = relPath.split('/').filter(Boolean)
    const genderFolder = parts.length >= 2 ? parts[parts.length - 2] : ''
    const ageFolder = parts.length >= 3 ? parts[parts.length - 3] : ''
    return {
        age: titleCase(ageFolder),
        gender: genderFolder ? detectGender(genderFolder) : 'Neutral',
    }
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

export default function BulkFolderUploadPage() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()
    const folderInputRef = useRef(null)

    const [items, setItems] = useState([])
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
        product_type: '',
        product_version: 'Old Packs',
        category: 'Clothing',
        fabric: '',
        color: '',
        brand_id: '',
        product_season_id: '',
        price: '',
        compare_price: '',
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

    useEffect(() => {
        if (folderInputRef.current) {
            folderInputRef.current.setAttribute('webkitdirectory', '')
            folderInputRef.current.setAttribute('directory', '')
        }
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

    function handleFolderSelect(e) {
        const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
        const nextItems = files.map((file, idx) => {
            const parsed = parseFile(file)
            return {
                id: String(Date.now()) + '_' + idx,
                file,
                previewUrl: URL.createObjectURL(file),
                age: parsed.age,
                gender: parsed.gender,
                status: 'pending',
                error: '',
            }
        })
        setItems(nextItems)
        setDoneCount(0)
    }

    function updateItem(id, patch) {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
    }

    function removeItem(id) {
        setItems((prev) => prev.filter((it) => it.id !== id))
    }

    function validateBatch() {
        if (!batch.product_type) return 'Product Type is required.'
        if (!batch.product_version) return 'Product Version is required.'
        if (!batch.product_season_id) return 'Product Season is required.'
        if (!batch.fabric) return 'Fabric is required.'
        if (!batch.color) return 'Color is required.'
        if (!batch.brand_id) return 'Brand is required.'
        if (!batch.price || parseFloat(batch.price) <= 0) return 'Price is required.'
        if (items.length === 0) return 'Select a folder with images first.'
        if (items.some((it) => !it.age)) return 'Some images have no detected size/age — set it manually on those rows (highlighted) before starting.'
        return ''
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

                sequence += 1
                const seq = String(sequence).padStart(3, '0')
                const title = (batch.title_prefix.trim() || batch.product_type) + ' – ' + item.gender + ' – ' + item.age + ' #' + seq

                const payload = {
                    title,
                    description: '',
                    price: parseFloat(batch.price) || 0,
                    compare_price: parseFloat(batch.compare_price) || 0,
                    category: batch.category,
                    product_type: batch.product_type,
                    fabric: batch.fabric,
                    color: batch.color,
                    gender: item.gender,
                    tags,
                    stock: parseInt(batch.quantity_per_item) || 1,
                    images: [uploadData.url],
                    variants: [{
                        option1_name: 'Size',
                        option1_value: item.age,
                        option2_name: '',
                        option2_value: '',
                        option3_name: '',
                        option3_value: '',
                        price: parseFloat(batch.price) || 0,
                        inventory_qty: parseInt(batch.quantity_per_item) || 1,
                        sku: '',
                    }],
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
                    <h1 className="font-display text-xl text-charcoal">Bulk Folder Upload</h1>
                    {items.length > 0 && (
                        <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{items.length} images</span>
                    )}
                </div>
                <p className="text-xs text-gray-400">Select an age folder (with Boys/Girls/Neutral subfolders) · one image = one product</p>
            </div>
            <AdminPortalNav />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Step 1: folder picker */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">1. Select folder</p>
                    <p className="text-xs text-gray-500 mb-4">
                        Pick the folder for one age/size (e.g. "3-4 Year"), containing subfolders like "Boys", "Girls", "Neutral".
                        You can also select a parent folder containing several age folders — each image's size and gender are read from its own folder path.
                    </p>
                    <input
                        ref={folderInputRef}
                        type="file"
                        multiple
                        onChange={handleFolderSelect}
                        className="block text-sm text-charcoal file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-coral file:text-white file:font-display hover:file:bg-opacity-90"
                    />
                </div>

                {/* Step 2: batch settings */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">2. Batch settings (applied to every product in this run)</p>
                    <p className="text-xs text-gray-500 mb-4">Size and gender come from the folders — everything else here can't be guessed from a photo, so set it once for the whole batch.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Title Prefix (optional)</label>
                            <input value={batch.title_prefix} onChange={(e) => setBatch((p) => ({ ...p, title_prefix: e.target.value }))}
                                   placeholder="Defaults to Product Type" className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
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
                            <label className="text-xs text-gray-500 mb-1 block">Fabric *</label>
                            <select value={batch.fabric} onChange={(e) => setBatch((p) => ({ ...p, fabric: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                <option value="">Select...</option>
                                {fabricOptions.map((f) => <option key={f} value={f}>{f}</option>)}
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
                            <label className="text-xs text-gray-500 mb-1 block">Price (PKR) *</label>
                            <input type="number" value={batch.price} onChange={(e) => setBatch((p) => ({ ...p, price: e.target.value }))}
                                   className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Compare-at Price (optional)</label>
                            <input type="number" value={batch.compare_price} onChange={(e) => setBatch((p) => ({ ...p, compare_price: e.target.value }))}
                                   className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Quantity per item</label>
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
                            <button onClick={startUpload} disabled={running}
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

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[600px] overflow-y-auto">
                            {items.map((item) => (
                                <div key={item.id} className={'rounded-xl border-2 p-2 relative ' + (!item.age ? 'border-orange-300 bg-orange-50' : 'border-gray-100')}>
                                    {item.status === 'pending' && !running && (
                                        <button onClick={() => removeItem(item.id)}
                                                className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full text-xs text-gray-400 hover:text-coral shadow z-10">✕</button>
                                    )}
                                    <img src={item.previewUrl} alt="" className="w-full aspect-square object-cover rounded-lg mb-2" />
                                    <input value={item.age} onChange={(e) => updateItem(item.id, { age: e.target.value })}
                                           placeholder="Size/Age" disabled={running}
                                           className="w-full text-xs border border-gray-200 rounded px-1.5 py-1 mb-1" />
                                    <select value={item.gender} onChange={(e) => updateItem(item.id, { gender: e.target.value })}
                                            disabled={running}
                                            className="w-full text-xs border border-gray-200 rounded px-1.5 py-1">
                                        {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                    {item.status === 'uploading' && <p className="text-[10px] text-blue-500 mt-1">Uploading...</p>}
                                    {item.status === 'done' && <p className="text-[10px] text-green-600 mt-1">✓ Created</p>}
                                    {item.status === 'failed' && <p className="text-[10px] text-red-500 mt-1" title={item.error}>✕ {item.error}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
