'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EmployeePortalNav from '@/components/EmployeePortalNav'
import { parseCaption, parseAgeRange } from '@/lib/captionParsing'

const DEFAULT_CATEGORY_OPTIONS = ['Clothing', 'Bedding', 'Bags', 'Accessories', 'Footwear', 'Toys', 'Shoes', 'Other']
const DEFAULT_PRODUCT_VERSION_OPTIONS = ['new arrivals', 'Old Packs']
const DEFAULT_PRODUCT_TYPE_OPTIONS = ['T-Shirt', 'Full Sleeves Shirt', 'Shorts', 'Denim Jeans', 'Trouser', 'Girl-Top', 'Frock', 'Socks', 'Jacket', 'Button Shirts', 'Jeans Shorts', 'Cargo Pents', 'Cargo Trousers', 'School Bags', 'Ladies Bags', 'Bag-Pack', 'Rompers', 'Kurta Trouser', 'Girls Kurti with Gharara', 'Girls Kurti with Trouser', 'Mock Necks']
const DEFAULT_FABRIC_OPTIONS = ['Cotton', 'Terry', 'Jersy', 'Fleece', 'Silk Cotton', 'Silk', 'Denim']
const DEFAULT_COLOR_OPTIONS = [
    'Black', 'White', 'Off White', 'Red', 'Blue', 'Navy Blue', 'Royal Blue', 'Light Blue', 'Green', 'Dark Green', 'Light Green',
    'Pink', 'Light Pink', 'Purple', 'Lavender', 'Yellow', 'Mustard', 'Orange', 'Peach', 'Grey', 'Light Grey', 'Silver',
    'Beige', 'Brown', 'Tan', 'Navy', 'Teal', 'Aqua', 'Maroon', 'Gold', 'Cream', 'Multi-color', 'Multi Color',
    'Skin', 'Mud', 'Khaki', 'Camel', 'Coffee', 'Chocolate', 'Rust', 'Olive', 'Charcoal', 'Sand', 'Dusty Pink', 'Mint'
]
const GENDER_OPTIONS = ['Girls', 'Boys', 'Neutral']
const UPLOAD_CONCURRENCY = 4

// Full selectable size range, 0 months through 10 years, in display order.
// "From"/"To" pick two points in this list; every bracket in between
// (inclusive) becomes its own variant — no arithmetic needed at upload time.
const SIZE_BRACKETS = [
    '0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M',
    '2-3 Year', '3-4 Year', '4-5 Year', '5-6 Year',
    '6-7 Year', '7-8 Year', '8-9 Year', '9-10 Year',
]

// OCR/folder detection only ever finds whole-year ranges (captions say
// "7-8 YEARS", never "6-9 Months") — map that onto the closest matching
// brackets here so auto-fill still lands somewhere sensible; the admin can
// always correct it via the dropdowns afterward.
function yearRangeToBracketRange(startYear, endYear) {
    if (!Number.isFinite(startYear) || !Number.isFinite(endYear) || endYear <= startYear) {
        return { from: '', to: '' }
    }
    const fromLabel = startYear <= 1 ? '12-18M' : (startYear + '-' + (startYear + 1) + ' Year')
    const toLabel = (endYear - 1) + '-' + endYear + ' Year'
    let fromIndex = SIZE_BRACKETS.indexOf(fromLabel)
    let toIndex = SIZE_BRACKETS.indexOf(toLabel)
    if (fromIndex === -1) fromIndex = 0
    if (toIndex === -1) toIndex = SIZE_BRACKETS.length - 1
    if (toIndex < fromIndex) toIndex = fromIndex
    return { from: SIZE_BRACKETS[fromIndex], to: SIZE_BRACKETS[toIndex] }
}

function isValidBracketRange(from, to) {
    const fromIndex = SIZE_BRACKETS.indexOf(from)
    const toIndex = SIZE_BRACKETS.indexOf(to)
    return fromIndex !== -1 && toIndex !== -1 && toIndex >= fromIndex
}

function detectFolderGender(folderName) {
    const s = String(folderName || '').toLowerCase()
    if (s.includes('girl')) return 'Girls'
    if (s.includes('boy')) return 'Boys'
    return ''
}

function titleCase(text) {
    return String(text || '').trim().replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// When a folder structure is used (age folder > gender subfolder > images),
// read gender from the image's immediate parent folder and size from the
// folder above that — same convention as a flat picker with no folders at all.
function parseFolderPath(file) {
    const relPath = file.webkitRelativePath || ''
    if (!relPath) return { folderAge: '', folderGender: '' }
    const parts = relPath.split('/').filter(Boolean)
    const genderFolder = parts.length >= 2 ? parts[parts.length - 2] : ''
    const ageFolder = parts.length >= 3 ? parts[parts.length - 3] : ''
    return {
        folderAge: titleCase(ageFolder),
        folderGender: genderFolder ? detectFolderGender(genderFolder) : '',
    }
}

// One row per (age bracket x sub-variant) combination — a photo spanning
// "3-6M" to "3-4 Year" and 2 colors in it produces every bracket in between
// x 2 colors, size and color both distinguishing each row.
function buildVariantMatrix(fromBracket, toBracket, subVariants, qty) {
    const fromIndex = SIZE_BRACKETS.indexOf(fromBracket)
    const toIndex = SIZE_BRACKETS.indexOf(toBracket)
    if (fromIndex === -1 || toIndex === -1 || toIndex < fromIndex) return []

    const variants = []
    const hasColors = subVariants.length > 1
    for (let i = fromIndex; i <= toIndex; i++) {
        const sizeLabel = SIZE_BRACKETS[i]
        for (const sv of subVariants) {
            variants.push({
                option1_name: 'Size',
                option1_value: sizeLabel,
                option2_name: hasColors ? 'Color' : '',
                option2_value: hasColors ? sv.label : '',
                option3_name: '', option3_value: '',
                price: sv.price, inventory_qty: qty, sku: '',
            })
        }
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

export default function EmployeeBulkProductUploadPage() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()
    const ocrWorkerRef = useRef(null)
    const folderInputRef = useRef(null)

    const [items, setItems] = useState([])
    const [analyzing, setAnalyzing] = useState(false)
    const [analyzedCount, setAnalyzedCount] = useState(0)
    const [running, setRunning] = useState(false)
    const [doneCount, setDoneCount] = useState(0)

    const [productTypeOptions, setProductTypeOptions] = useState(DEFAULT_PRODUCT_TYPE_OPTIONS)
    const [productVersionOptions, setProductVersionOptions] = useState(DEFAULT_PRODUCT_VERSION_OPTIONS)
    const [fabricOptions, setFabricOptions] = useState(DEFAULT_FABRIC_OPTIONS)
    const [categoryOptions, setCategoryOptions] = useState(DEFAULT_CATEGORY_OPTIONS)
    const [seasonOptions, setSeasonOptions] = useState([])
    const [brandOptions, setBrandOptions] = useState([])

    const [batch, setBatch] = useState({
        title_prefix: 'Kids Affordable Collection 2026: Kids Boys Warm Winter',
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
        campaign_tier: '',
    })

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token') || ''
            if (!token) {
                const employee = localStorage.getItem('employee')
                if (!employee) { router.push('/admin'); return }
                setVerified(true)
                fetchMetadata()
                return
            }
            try {
                const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await res.json()
                if (!data.valid) {
                    localStorage.removeItem('admin_token')
                    const employee = localStorage.getItem('employee')
                    if (!employee) { router.push('/admin'); return }
                }
                setVerified(true)
                fetchMetadata()
            } catch {
                const employee = localStorage.getItem('employee')
                if (!employee) { router.push('/admin'); return }
                setVerified(true)
                fetchMetadata()
            }
        }
        verify()
        return () => {
            if (ocrWorkerRef.current) {
                ocrWorkerRef.current.then((w) => w.terminate()).catch(() => {})
            }
        }
    }, [])

    useEffect(() => {
        if (folderInputRef.current) {
            folderInputRef.current.setAttribute('webkitdirectory', '')
            folderInputRef.current.setAttribute('directory', '')
        }
    }, [])

    // Loaded lazily and reused across every image in the batch — spinning up
    // tesseract's WASM worker + language data takes a few seconds, so doing
    // it once instead of per-image keeps the batch fast after the first photo.
    async function getOcrWorker() {
        if (!ocrWorkerRef.current) {
            ocrWorkerRef.current = (async () => {
                const { createWorker } = await import('tesseract.js')
                return createWorker('eng')
            })()
        }
        return ocrWorkerRef.current
    }

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

    function effectiveGender(item) { return item.gender || batch.gender }
    function effectiveProductType(item) { return item.productType || batch.product_type }
    function effectiveBrandId(item) { return item.brandId || batch.brand_id }
    function effectiveColor(item) { return item.color || batch.color }

    function updateItem(id, patch) {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
    }

    function removeItem(id) {
        setItems((prev) => prev.filter((it) => it.id !== id))
    }

    function addSubVariant(itemId) {
        setItems((prev) => prev.map((it) => (it.id === itemId
            ? { ...it, subVariants: [...it.subVariants, { label: '', price: it.subVariants[0]?.price || '' }] }
            : it)))
    }

    function removeSubVariant(itemId, idx) {
        setItems((prev) => prev.map((it) => (it.id === itemId
            ? { ...it, subVariants: it.subVariants.filter((_, i) => i !== idx) }
            : it)))
    }

    function updateSubVariant(itemId, idx, patch) {
        setItems((prev) => prev.map((it) => (it.id === itemId
            ? { ...it, subVariants: it.subVariants.map((sv, i) => (i === idx ? { ...sv, ...patch } : sv)) }
            : it)))
    }

    async function analyzeAndLoadItems(files) {
        const nextItems = files.map((file, idx) => {
            const { folderAge, folderGender } = parseFolderPath(file)
            return {
                id: String(Date.now()) + '_' + idx,
                file,
                previewUrl: URL.createObjectURL(file),
                folderAge, folderGender,
                ageStart: '', ageEnd: '', fabric: '',
                productType: '', gender: '', brandId: '', color: '',
                subVariants: [{ label: '', price: '' }],
                status: 'pending',
                error: '',
            }
        })
        setItems(nextItems)
        setDoneCount(0)
        setAnalyzedCount(0)

        setAnalyzing(true)
        try {
            const worker = await getOcrWorker()
            for (const item of nextItems) {
                updateItem(item.id, { status: 'analyzing' })
                try {
                    const { data } = await worker.recognize(item.file)
                    const parsed = parseCaption(data?.text || '')
                    // OCR is the primary source (it's what's actually printed on this
                    // exact photo); the folder path only fills in what OCR missed.
                    const folderRange = item.folderAge ? parseAgeRange(item.folderAge) : { ageStart: null, ageEnd: null }
                    const detectedStartYear = parsed.ageStart ?? folderRange.ageStart ?? null
                    const detectedEndYear = parsed.ageEnd ?? folderRange.ageEnd ?? null
                    const { from: ageStart, to: ageEnd } = yearRangeToBracketRange(detectedStartYear, detectedEndYear)
                    // Caption lists per-item prices (e.g. "899/- SHIRT" + "1450/-
                    // HOODIE") -> pre-fill one sub-variant row per detected price.
                    // Otherwise fall back to a single row with the shared price —
                    // OCR can't tell us how many garments are actually in the photo,
                    // so the admin adds more rows manually when there's more than one.
                    const subVariants = parsed.multiPrices.length >= 2
                        ? parsed.multiPrices.map((mp) => ({ label: titleCase(mp.label), price: String(mp.price) }))
                        : [{ label: '', price: parsed.price != null ? String(parsed.price) : '' }]
                    updateItem(item.id, {
                        status: 'analyzed',
                        ageStart,
                        ageEnd,
                        fabric: parsed.fabric || '',
                        productType: parsed.productType || '',
                        // A deliberately-organized Boys/Girls folder is more
                        // trustworthy than OCR gender, which can false-positive
                        // on decorative print text elsewhere in the photo (e.g.
                        // "wonderful girl" printed on the garment design itself).
                        gender: item.folderGender || parsed.gender || '',
                        subVariants,
                    })
                } catch (err) {
                    updateItem(item.id, { status: 'analyzed', error: 'OCR: ' + err.message })
                }
                setAnalyzedCount((c) => c + 1)
            }
        } catch (err) {
            alert('Could not start caption reader: ' + err.message)
        }
        setAnalyzing(false)
    }

    async function handleFileSelect(e) {
        const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
        e.target.value = ''
        await analyzeAndLoadItems(files)
    }

    async function handleFolderSelect(e) {
        const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
        await analyzeAndLoadItems(files)
    }

    function validateBatch() {
        if (!batch.product_version) return 'Product Version is required.'
        if (!batch.product_season_id) return 'Product Season is required.'
        if (items.length === 0) return 'Select images or a folder first.'
        for (const it of items) {
            if (!isValidBracketRange(it.ageStart, it.ageEnd)) {
                return 'Some images have no valid age/size detected — fill From/To manually on highlighted rows.'
            }
            for (const sv of it.subVariants) {
                const price = parseFloat(sv.price) || parseFloat(batch.fallback_price)
                if (!price || price <= 0) {
                    return 'Some images have an item with no price detected and no fallback price set — fill one or the other.'
                }
            }
            if (it.subVariants.length > 1 && it.subVariants.some((sv) => !sv.label.trim())) {
                return 'Some images have multiple items but one or more has no color/label to tell it apart — fill it in.'
            }
            const fabric = it.fabric || batch.fallback_fabric
            if (!fabric) {
                return 'Some images have no fabric detected and no fallback fabric set — fill one or the other.'
            }
            if (!effectiveProductType(it)) {
                return 'Some images have no Product Type — pick one on that row or set a batch default.'
            }
            if (!effectiveBrandId(it)) {
                return 'Some images have no Brand — pick one on that row or set a batch default.'
            }
            if (!effectiveColor(it)) {
                return 'Some images have no Color — pick one on that row or set a batch default.'
            }
        }
        return ''
    }

    function rowIsIncomplete(it) {
        const validAge = isValidBracketRange(it.ageStart, it.ageEnd)
        const validPrice = it.subVariants.every((sv) => (parseFloat(sv.price) || parseFloat(batch.fallback_price)) > 0)
        const validLabels = it.subVariants.length === 1 || it.subVariants.every((sv) => sv.label.trim())
        const validFabric = Boolean(it.fabric || batch.fallback_fabric)
        const validType = Boolean(effectiveProductType(it))
        const validBrand = Boolean(effectiveBrandId(it))
        const validColor = Boolean(effectiveColor(it))
        return !validAge || !validPrice || !validLabels || !validFabric || !validType || !validBrand || !validColor
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
                const uploadRes = await fetch('/api/admin/upload-image', { method: 'POST', headers: { 'x-admin-token': token }, body: formData })
                const uploadData = await readJson(uploadRes)
                if (!uploadRes.ok || !uploadData.success || !uploadData.url) {
                    throw new Error(uploadData.error || 'Image upload failed')
                }

                const resolvedSubVariants = item.subVariants.map((sv, i) => ({
                    label: sv.label.trim() || ('Item ' + (i + 1)),
                    price: parseFloat(sv.price) || parseFloat(batch.fallback_price) || 0,
                }))
                const fabric = item.fabric || batch.fallback_fabric
                const gender = effectiveGender(item)
                const productType = effectiveProductType(item)
                const brandId = effectiveBrandId(item)
                const color = effectiveColor(item)
                const qty = parseInt(batch.quantity_per_item) || 1
                const variants = buildVariantMatrix(item.ageStart, item.ageEnd, resolvedSubVariants, qty)
                const price = resolvedSubVariants[0].price

                sequence += 1
                const seq = String(sequence).padStart(3, '0')
                const ageLabel = item.ageStart === item.ageEnd ? item.ageStart : (item.ageStart + ' to ' + item.ageEnd)
                const title = (batch.title_prefix.trim() || productType) + ' – ' + gender + ' – ' + ageLabel + ' #' + seq

                const payload = {
                    title,
                    description: '',
                    price,
                    compare_price: 0,
                    category: batch.category,
                    product_type: productType,
                    fabric,
                    color,
                    gender,
                    tags,
                    stock: variants.reduce((sum, v) => sum + v.inventory_qty, 0),
                    images: [uploadData.url],
                    variants,
                    product_version: batch.product_version,
                    product_season_id: Number(batch.product_season_id),
                    character_id: null,
                    brand_id: Number(brandId),
                    status: batch.status,
                    is_active: batch.status === 'active',
                    campaign_tier: batch.campaign_tier ? Number(batch.campaign_tier) : null,
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
                    <Link href="/employee/products" className="text-gray-400 hover:text-coral text-sm">← Products</Link>
                    <h1 className="font-display text-xl text-charcoal">Bulk Product Upload</h1>
                    {items.length > 0 && (
                        <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{items.length} images</span>
                    )}
                </div>
                <p className="text-xs text-gray-400">Every photo is OCR-scanned for size, price, fabric &amp; gender · one photo = one product, with a variant per size and per item shown in the photo</p>
            </div>
            <EmployeePortalNav />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Step 1: image picker */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">1. Select photos</p>
                    <p className="text-xs text-gray-500 mb-4">
                        Every photo is read automatically for a printed caption like "1-10 YEARS · 1750/- ONLY" — a single age like "2-3 Year" makes one product, a range like "2-6 Year" makes one product with every yearly size from 2-3 up to 5-6.
                        If a photo shows more than one item (e.g. 2-3 shirts laid out together), click "+ Another item in this photo" on that row and give each one a color/label — OCR can read a per-item price when the caption lists one for each (e.g. "899/- SHIRT" + "1450/- HOODIE"), but it can't see how many garments are in a photo or tell their colors apart, so that part needs your eyes.
                        If you organize photos in folders (age folder → Boys/Girls/Neutral subfolder), that folder path fills in anything the caption doesn't state. Free OCR isn't perfect — always check the detected values below before uploading.
                    </p>
                    <div className="flex flex-wrap gap-6">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 mb-1">Select individual photos</p>
                            <p className="text-[10px] text-gray-400 mb-1 max-w-xs">No gender/size from a folder here — even if you browse into a "Boys" folder and select files, the browser doesn't tell us that. Use this only if the caption states everything, or you'll set Gender manually.</p>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="block text-sm text-charcoal file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-coral file:text-white file:font-display hover:file:bg-opacity-90"
                            />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 mb-1">Or select a folder</p>
                            <p className="text-[10px] text-gray-400 mb-1 max-w-xs">Click this button, then in the dialog SINGLE-CLICK the folder (e.g. "Boys") to highlight it and click Open — don't double-click into it. This is the only way the site can read the folder name.</p>
                            <input
                                ref={folderInputRef}
                                type="file"
                                multiple
                                webkitdirectory=""
                                directory=""
                                onChange={handleFolderSelect}
                                className="block text-sm text-charcoal file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-600 file:text-white file:font-display hover:file:bg-indigo-700"
                            />
                        </div>
                    </div>
                    {analyzing && (
                        <p className="text-xs text-blue-500 mt-3">
                            Reading captions in your browser ({analyzedCount}/{items.length})... first photo takes a few extra seconds to load the reader.
                        </p>
                    )}
                </div>

                {/* Step 2: batch settings */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="font-display text-lg text-charcoal mb-1">2. Batch settings</p>
                    <p className="text-xs text-gray-500 mb-4">Size/price/fabric/product type/gender are read per photo automatically, editable below. Gender, Product Type and Brand set here are just defaults — override them per photo if a caption doesn't state it or gets it wrong.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Title Prefix (optional)</label>
                            <input value={batch.title_prefix} onChange={(e) => setBatch((p) => ({ ...p, title_prefix: e.target.value }))}
                                   placeholder="Defaults to Product Type" className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Gender (default)</label>
                            <select value={batch.gender} onChange={(e) => setBatch((p) => ({ ...p, gender: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Product Type (default)</label>
                            <select value={batch.product_type} onChange={(e) => setBatch((p) => ({ ...p, product_type: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                <option value="">None — set per photo below</option>
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
                            <label className="text-xs text-gray-500 mb-1 block">Color (default)</label>
                            <select value={batch.color} onChange={(e) => setBatch((p) => ({ ...p, color: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                <option value="">None — set per photo below</option>
                                {DEFAULT_COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Brand (default)</label>
                            <select value={batch.brand_id} onChange={(e) => setBatch((p) => ({ ...p, brand_id: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                <option value="">None — set per photo below</option>
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
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Campaign Tier (optional)</label>
                            <select value={batch.campaign_tier} onChange={(e) => setBatch((p) => ({ ...p, campaign_tier: e.target.value }))}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm">
                                <option value="">Not in a campaign</option>
                                {Array.from({ length: 10 }, (_, i) => i + 1).map((tier) => (
                                    <option key={tier} value={tier}>{tier}{tier === 1 ? ' (current campaign)' : ''}</option>
                                ))}
                            </select>
                            <p className="text-[11px] text-gray-400 mt-1">Tags every product in this batch for the /campaign landing page.</p>
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
                                    <div className="group relative flex-shrink-0">
                                        <img src={item.previewUrl} alt="" className="w-20 h-20 object-cover rounded-lg" />
                                        {/* fixed (not absolute) so the scrollable review list's overflow-y-auto
                                            doesn't clip this — a plain absolute popup would get cut off. */}
                                        <img src={item.previewUrl} alt="" className="hidden group-hover:block fixed top-24 right-8 z-50 w-72 h-72 md:w-96 md:h-96 object-contain rounded-xl border-4 border-white shadow-2xl bg-white pointer-events-none" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        {(item.folderAge || item.folderGender) ? (
                                            <p className="text-[10px] text-indigo-600 font-semibold">📁 {[item.folderAge, item.folderGender].filter(Boolean).join(' · ')}</p>
                                        ) : (
                                            <p className="text-[10px] text-gray-300">No folder path on this file — used the folder picker?</p>
                                        )}
                                        <div className="flex gap-1">
                                            <select value={item.ageStart} onChange={(e) => updateItem(item.id, { ageStart: e.target.value })}
                                                    disabled={running}
                                                    className="w-1/2 text-xs border border-gray-200 rounded px-1.5 py-1">
                                                <option value="">From</option>
                                                {SIZE_BRACKETS.map((b) => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                            <select value={item.ageEnd} onChange={(e) => updateItem(item.id, { ageEnd: e.target.value })}
                                                    disabled={running}
                                                    className="w-1/2 text-xs border border-gray-200 rounded px-1.5 py-1">
                                                <option value="">To</option>
                                                {SIZE_BRACKETS.map((b) => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1 rounded-lg border border-gray-100 bg-cream/60 p-1.5">
                                            {item.subVariants.map((sv, idx) => (
                                                <div key={idx} className="flex gap-1">
                                                    {item.subVariants.length > 1 && (
                                                        <input value={sv.label} onChange={(e) => updateSubVariant(item.id, idx, { label: e.target.value })}
                                                               placeholder={'Item ' + (idx + 1) + ' color'} disabled={running}
                                                               className="w-1/2 text-xs border border-gray-200 rounded px-1.5 py-1" />
                                                    )}
                                                    <input type="number" value={sv.price} onChange={(e) => updateSubVariant(item.id, idx, { price: e.target.value })}
                                                           placeholder="Price" disabled={running}
                                                           className={(item.subVariants.length > 1 ? 'w-1/2' : 'w-full') + ' text-xs border border-gray-200 rounded px-1.5 py-1'} />
                                                    {item.subVariants.length > 1 && !running && (
                                                        <button onClick={() => removeSubVariant(item.id, idx)}
                                                                className="text-xs text-gray-300 hover:text-coral px-1">✕</button>
                                                    )}
                                                </div>
                                            ))}
                                            {!running && (
                                                <button onClick={() => addSubVariant(item.id)}
                                                        className="text-[10px] text-coral hover:underline">+ Another item in this photo</button>
                                            )}
                                        </div>
                                        <select value={item.fabric} onChange={(e) => updateItem(item.id, { fabric: e.target.value })}
                                                disabled={running}
                                                className="w-full text-xs border border-gray-200 rounded px-1.5 py-1">
                                            <option value="">Fabric (fallback)</option>
                                            {fabricOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                        <select value={item.gender} onChange={(e) => updateItem(item.id, { gender: e.target.value })}
                                                disabled={running}
                                                className="w-full text-xs border border-gray-200 rounded px-1.5 py-1">
                                            <option value="">Gender ({batch.gender})</option>
                                            {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                        <select value={item.productType} onChange={(e) => updateItem(item.id, { productType: e.target.value })}
                                                disabled={running}
                                                className="w-full text-xs border border-gray-200 rounded px-1.5 py-1">
                                            <option value="">Product Type{batch.product_type ? ' (' + batch.product_type + ')' : ' — pick one'}</option>
                                            {productTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <select value={item.brandId} onChange={(e) => updateItem(item.id, { brandId: e.target.value })}
                                                disabled={running}
                                                className="w-full text-xs border border-gray-200 rounded px-1.5 py-1">
                                            <option value="">Brand{batch.brand_id ? ' (default)' : ' — pick one'}</option>
                                            {brandOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                        <select value={item.color} onChange={(e) => updateItem(item.id, { color: e.target.value })}
                                                disabled={running}
                                                className="w-full text-xs border border-gray-200 rounded px-1.5 py-1">
                                            <option value="">Color{batch.color ? ' (' + batch.color + ')' : ' — pick one'}</option>
                                            {DEFAULT_COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
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
