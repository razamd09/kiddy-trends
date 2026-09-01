'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const MONOCHROME_BG_COLORS = ['transparent', '#000000', '#1f2937', '#374151', '#6b7280', '#9ca3af', '#ffffff']
const STANDARD_BG_COLORS = ['#991b1b', '#7c7a00', '#166534', '#0f766e', '#1d4ed8', '#6b21a8', '#ea580c', '#ec4899']
const DEFAULT_CATEGORY_OPTIONS = ['Clothing', 'Bedding', 'Bags', 'Accessories', 'Footwear', 'Toys', 'Shoes', 'Other']
const DEFAULT_PRODUCT_VERSION_OPTIONS = ['new arrivals', 'Old Packs']
const DEFAULT_PRODUCT_TYPE_OPTIONS = ['T-Shirt', 'Full Sleeves Shirt', 'Shorts', 'Denim Jeans', 'Trouser', 'Girl-Top', 'Frock', 'Socks', 'Jacket', 'Button Shirts', 'Jeans Shorts', 'Cargo Pents', 'Cargo Trousers', 'School Bags', 'Ladies Bags', 'Bag-Pack', 'Rompers', 'Kurta Trouser', 'Girls Kurti with Gharara', 'Girls Kurti with Trouser', 'Mock Necks']
const DEFAULT_FABRIC_OPTIONS = ['Cotton', 'Terry', 'Jersy', 'Fleece', 'Silk Cotton', 'Silk', 'Denim']
const DEFAULT_COLOR_OPTIONS = [
    'Black', 'White', 'Red', 'Blue', 'Navy Blue', 'Royal Blue', 'Light Blue', 'Green', 'Dark Green', 'Light Green',
    'Pink', 'Light Pink', 'Purple', 'Lavender', 'Yellow', 'Mustard', 'Orange', 'Peach', 'Grey', 'Light Grey', 'Silver',
    'Beige', 'Brown', 'Tan', 'Navy', 'Teal', 'Aqua', 'Maroon', 'Gold', 'Cream', 'Multi-color', 'Multi Color'
]
const DEFAULT_GENDER_OPTIONS = ['Girls', 'Boys', 'Neutral']

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

export default function AdminProducts() {
    const DRAFT_MODE = 'draft'
    const PRODUCTION_MODE = 'production'
    const [products, setProducts]     = useState([])
    const [loading, setLoading]       = useState(true)
    const [verified, setVerified]     = useState(false)
    const [showForm, setShowForm]     = useState(false)
    const [editingId, setEditingId]   = useState(null)
    const [page, setPage]             = useState(1)
    const [total, setTotal]           = useState(0)
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [variantFilter, setVariantFilter] = useState('all')
    const [sortBy, setSortBy] = useState('created_at')
    const [sortDir, setSortDir] = useState('desc')
    const [submitting, setSubmitting] = useState(false)
    const [duplicatingId, setDuplicatingId] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [selectedIds, setSelectedIds] = useState([])
    const [categoryOptions, setCategoryOptions] = useState(DEFAULT_CATEGORY_OPTIONS)
    const [productVersionOptions, setProductVersionOptions] = useState(DEFAULT_PRODUCT_VERSION_OPTIONS)
    const [productTypeOptions, setProductTypeOptions] = useState(DEFAULT_PRODUCT_TYPE_OPTIONS)
    const [productSeasonOptions, setProductSeasonOptions] = useState([])
    const [fabricOptions, setFabricOptions] = useState(DEFAULT_FABRIC_OPTIONS)
    const [employeeNameByCode, setEmployeeNameByCode] = useState({})
    const [bulkProcessing, setBulkProcessing] = useState(false)
    const [recentBgRemoving, setRecentBgRemoving] = useState(false)
    const [bulkEditOpen, setBulkEditOpen] = useState(false)
    const [bulkEditForm, setBulkEditForm] = useState({
        title: '',
        category: '',
        product_type: '',
        fabric: '',
        product_season_id: '',
        product_version: '',
        status: '',
    })
    const [loadError, setLoadError] = useState('')
    const [form, setForm] = useState({
        title: '', description: '', price: '', compare_price: '',
        category: '', product_type: '', fabric: '', color: '', gender: '', tags: '', stock: '',
        product_version: '', product_season_id: '', status: ''
    })
    const [formImages, setFormImages] = useState([])   // [{url, rotating}]
    const [formVariants, setFormVariants] = useState([]) // [{option1_name,option1_value,option2_name,option2_value,price,stock,sku}]
    const [rotatingIdx, setRotatingIdx] = useState(null)
    const [imageEditor, setImageEditor] = useState({
        open: false,
        index: null,
        rotate: 0,
        flipHorizontal: false,
        flipVertical: false,
        fit: 'contain',
        background: '#ffffff',
        removeBackground: false,
        saving: false,
    })
    const router = useRouter()

    const COMMON_SIZES = ['0-3M','3-6M','6-9M','9-12M','1-2Y','2-3Y','3-4Y','4-5Y','5-6Y','6-7Y','7-8Y','8-9Y','9-10Y','10-11Y','11-12Y','XS','S','M','L','XL']

    function normalizeVariantLabel(value) {
        return String(value || '')
            .replace(/([0-9])\s*-\s*([0-9])\s*[Yy]/g, '$1-$2 Year')
            .replace(/\s+/g, ' ')
            .trim()
    }

    function normalizeVariantInputValue(field, value) {
        if (!/^option[123]_value$/.test(field)) return value

        const text = String(value || '').trim()
        if (/^5\s*[-–]\s*5(?:\s*(?:years?|yrs?|yr|y))?$/i.test(text)) {
            if (/years?|yrs?|yr/i.test(text)) return '5-6 Year'
            if (/y$/i.test(text)) return '5-6Y'
            return '5-6'
        }

        return value
    }

    function getProductVariantValues(product) {
        if (!Array.isArray(product?.variants)) return []
        const values = []
        for (const variant of product.variants) {
            const label = normalizeVariantLabel(variant?.option1_value || variant?.title || variant?.size || '')
            if (label) values.push(label)
        }
        return values
    }

    function normalizeImages(images) {
        if (Array.isArray(images)) {
            return images
                .map(img => typeof img === 'string' ? img : img?.src)
                .filter(Boolean)
        }

        if (typeof images === 'string') {
            const trimmed = images.trim()
            if (!trimmed) return []

            try {
                const parsed = JSON.parse(trimmed)
                if (Array.isArray(parsed)) {
                    return parsed
                        .map(img => typeof img === 'string' ? img : img?.src)
                        .filter(Boolean)
                }
            } catch {}

            if (trimmed.includes('\n')) {
                return trimmed.split('\n').map(s => s.trim()).filter(Boolean)
            }

            return [trimmed]
        }

        return []
    }

    async function readApiJson(res) {
        const text = await res.text()
        if (!text) return {}
        try {
            return JSON.parse(text)
        } catch {
            return { success: false, error: text }
        }
    }

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
            try {
                const res  = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await readApiJson(res)
                if (!data.valid) {
                    localStorage.removeItem('admin_token')
                    router.push('/admin')
                } else {
                    setVerified(true)
                }
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

    useEffect(() => {
        if (verified) fetchProducts()
    }, [verified, page, searchTerm, categoryFilter, variantFilter, sortBy, sortDir])

    useEffect(() => {
        if (verified) fetchProductMetadata()
    }, [verified])

    useEffect(() => {
        if (verified) fetchEmployeeNames()
    }, [verified])

    useEffect(() => {
        if (!verified) return
        setPage(1)
    }, [searchTerm, categoryFilter, variantFilter, sortBy, sortDir, verified])

    const productsApiBase = '/api/admin/products'

    async function fetchMetadataOptions(path, key, fallback) {
        const token = localStorage.getItem('admin_token') || ''
        try {
            const res = await fetch(path, { headers: { 'x-admin-token': token } })
            const data = await readApiJson(res)
            const nextOptions = Array.isArray(data?.[key])
                ? data[key].map((item) => String(item?.name || '').trim()).filter(Boolean)
                : []

            return res.ok && nextOptions.length > 0 ? nextOptions : fallback
        } catch {
            return fallback
        }
    }

    async function fetchSeasonOptions() {
        const token = localStorage.getItem('admin_token') || ''
        try {
            const res = await fetch('/api/admin/product-seasons', { headers: { 'x-admin-token': token } })
            const data = await readApiJson(res)
            return res.ok && Array.isArray(data?.seasons) ? data.seasons : []
        } catch {
            return []
        }
    }

    async function fetchProductMetadata() {
        const [categories, versions, types, fabrics, seasons] = await Promise.all([
            fetchMetadataOptions('/api/admin/product-categories', 'categories', DEFAULT_CATEGORY_OPTIONS),
            fetchMetadataOptions('/api/admin/product-versions', 'versions', DEFAULT_PRODUCT_VERSION_OPTIONS),
            fetchMetadataOptions('/api/admin/product-types', 'types', DEFAULT_PRODUCT_TYPE_OPTIONS),
            fetchMetadataOptions('/api/admin/product-fabrics', 'fabrics', DEFAULT_FABRIC_OPTIONS),
            fetchSeasonOptions(),
        ])
        setCategoryOptions(categories)
        setProductVersionOptions(versions)
        setProductTypeOptions(types)
        setFabricOptions(fabrics)
        setProductSeasonOptions(seasons)
    }

    async function fetchEmployeeNames() {
        const token = localStorage.getItem('admin_token') || ''
        try {
            const res = await fetch('/api/admin/employees', { headers: { 'x-admin-token': token } })
            const data = await readApiJson(res)
            if (!res.ok || !Array.isArray(data?.employees)) return

            const nextMap = {}
            data.employees.forEach((employee) => {
                const name = String(employee?.name || '').trim()
                if (!name) return
                const employeeCode = String(employee?.employee_id || '').trim()
                const id = String(employee?.id || '').trim()
                if (employeeCode) nextMap[employeeCode.toLowerCase()] = name
                if (id) nextMap[id.toLowerCase()] = name
            })
            setEmployeeNameByCode(nextMap)
        } catch {}
    }

    function formatProductActor(value) {
        const text = String(value || '').trim()
        if (!text) return '—'

        const code = text.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase()
        return employeeNameByCode[code] || text
    }

    async function fetchProducts() {
        setLoading(true)
        setLoadError('')
        const token = localStorage.getItem('admin_token')
        try {
            const params = new URLSearchParams({
                page: String(page),
                sortBy,
                sortDir,
            })
            if (searchTerm.trim()) params.set('search', searchTerm.trim())
            if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter)
            if (variantFilter && variantFilter !== 'all') params.set('variant', variantFilter)
            const res  = await fetch(productsApiBase + '?' + params.toString(), { headers: { 'x-admin-token': token } })
            const data = await readApiJson(res)
            if (!res.ok || data.error) {
                setProducts([])
                setTotal(0)
                setLoadError(data.error || 'Unable to load products')
            } else {
                const normalizedProducts = (data.products || []).map(product => ({
                    ...product,
                    images: normalizeImages(product.images),
                }))
                setProducts(normalizedProducts)
                setTotal(data.total || 0)
            }
        } catch (err) {
            setProducts([])
            setTotal(0)
            setLoadError(err.message || 'Unable to load products')
        }
        setLoading(false)
    }

    function handleHeaderSort(nextSortBy) {
        if (sortBy === nextSortBy) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
            return
        }
        setSortBy(nextSortBy)
        setSortDir(nextSortBy === 'title' || nextSortBy === 'category' || nextSortBy === 'status' ? 'asc' : 'desc')
    }

    function renderSortableHeader(label, key, align = 'left') {
        const isActive = sortBy === key
        const arrow = isActive ? (sortDir === 'asc' ? '↑' : '↓') : '↕'
        const alignClass = align === 'center' ? 'justify-center text-center' : 'justify-start text-left'

        return (
            <button
                type="button"
                onClick={() => handleHeaderSort(key)}
                className={'inline-flex items-center gap-1 font-semibold transition-colors hover:text-coral ' + alignClass + ' ' + (isActive ? 'text-coral' : 'text-charcoal')}
            >
                <span>{label}</span>
                <span className="text-xs">{arrow}</span>
            </button>
        )
    }

    function getActorHeaders(includeJson = false) {
        const headers = {}
        if (includeJson) headers['Content-Type'] = 'application/json'

        const token = localStorage.getItem('admin_token') || ''
        if (token) headers['x-admin-token'] = token

        try {
            const employee = JSON.parse(localStorage.getItem('employee') || '{}')
            const actorId = String(employee?.employee_id || employee?.id || '').trim()
            const actorName = String(employee?.name || '').trim()
            const actorRole = String(employee?.role || (token ? 'admin' : '')).trim()
            if (actorId) headers['x-actor-id'] = actorId
            if (actorName) headers['x-actor-name'] = actorName
            if (actorRole) headers['x-actor-role'] = actorRole
        } catch {
            if (token) {
                headers['x-actor-id'] = 'admin'
                headers['x-actor-name'] = 'Admin'
                headers['x-actor-role'] = 'admin'
            }
        }

        return headers
    }

    function toggleSelectProduct(productId) {
        setSelectedIds(prev => prev.includes(productId)
            ? prev.filter(id => id !== productId)
            : [...prev, productId]
        )
    }

    function toggleSelectAllProducts(list) {
        const ids = list.map(p => p.id)
        if (ids.length === 0) return
        const allSelected = ids.every(id => selectedIds.includes(id))
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...ids])))
        }
    }

    function clearSelection() {
        setSelectedIds([])
    }

    // Toggle a product between Active and Draft straight from the list.
    async function toggleStatus(product) {
        const newActive = !product.is_active
        // Optimistic update
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: newActive } : p))
        try {
            const token = localStorage.getItem('admin_token')
            const res = await fetch(productsApiBase, {
                method:  'PUT',
                headers: getActorHeaders(true),
                body:    JSON.stringify({ id: product.id, is_active: newActive }),
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'Update failed')
            // Sync server-computed fields (last action, etc.)
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...data.product } : p))
        } catch (err) {
            // Revert on failure
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: product.is_active } : p))
            alert('Failed to update status: ' + (err.message || 'Unknown error'))
        }
    }

    function buildShortProductHandle(title, fallbackId = Date.now()) {
        const rawTitle = String(title || '').trim()
        const slug = rawTitle
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-')
            .slice(0, 55)
            .replace(/-+$/g, '')
        const base = slug || 'product'
        const uniqueSuffix = String(fallbackId || Date.now()).slice(-6)
        return `${base}-${uniqueSuffix}`
    }

    async function handleDuplicate(product) {
        setDuplicatingId(product.id)
        const token = localStorage.getItem('admin_token')
        try {
            const duplicatePayload = {
                title: (product.title || 'Untitled Product') + ' (Copy)',
                description: product.description || '',
                price: product.price || 0,
                compare_price: product.compare_price || null,
                category: product.category || '',
                product_type: product.product_type || '',
                fabric: product.fabric || '',
                tags: Array.isArray(product.tags) ? product.tags : [],
                stock: product.stock || 0,
                images: normalizeImages(product.images),
                variants: Array.isArray(product.variants) ? product.variants : null,
                shopify_handle: buildShortProductHandle((product.title || 'Untitled Product') + ' duplicate', product.id || Date.now()),
                product_version: product.product_version || 'Old Packs',
                product_season_id: product.product_season_id || null,
                is_active: product.is_active !== false,
            }

            const res = await fetch(productsApiBase, {
                method: 'POST',
                headers: getActorHeaders(true),
                body: JSON.stringify(duplicatePayload),
            })
            const data = await readApiJson(res)
            if (!res.ok || !data.success) {
                alert('Duplicate failed: ' + (data.error || 'Unknown error'))
            } else {
                fetchProducts()
            }
        } catch (err) {
            alert('Duplicate failed: ' + (err.message || 'Unknown error'))
        }
        setDuplicatingId(null)
    }

    function resetForm() {
        setForm({ title: '', description: '', price: '', compare_price: '', category: '', product_type: '', fabric: '', color: '', gender: '', tags: '', stock: '', product_version: '', product_season_id: '', status: '' })
        setFormImages([])
        setFormVariants([])
        setEditingId(null)
        setImageEditor(prev => ({ ...prev, open: false, saving: false }))
    }

    function openEdit(product) {
        const imgs = normalizeImages(product.images)
        setFormImages(imgs.map(url => ({ url })))
        setImageEditor(prev => ({ ...prev, open: false, saving: false }))

        // Parse variants from DB format
        let variants = []
        const raw = product.variants
        if (Array.isArray(raw) && raw.length > 0) {
            variants = raw.map(v => ({
                option1_name:  v.option1_name  || 'Size',
                option1_value: v.option1_value || '',
                option2_name:  v.option2_name  || '',
                option2_value: v.option2_value || '',
                option3_name:  v.option3_name  || '',
                option3_value: v.option3_value || '',
                price:         v.price         !== undefined ? String(v.price) : String(product.price || ''),
                stock:         v.inventory_qty !== undefined ? String(v.inventory_qty) : String(v.stock || ''),
                sku:           v.sku           || '',
            }))
        }
        setFormVariants(variants)

        setForm({
            title:         product.title         || '',
            description:   product.description   || '',
            price:         product.price         || '',
            compare_price: product.compare_price || '',
            category:      product.category      || '',
            product_type:  product.product_type  || '',
            fabric:        product.fabric        || '',
            color:         product.color         || '',
            gender:        product.gender        || '',
            tags:          (product.tags || []).join(', '),
            stock:         product.stock         || '',
            product_version: product.product_version || '',
            product_season_id: product.product_season_id ? String(product.product_season_id) : '',
            status: product.is_active === false ? 'draft' : 'active',
        })
        setEditingId(product.id)
        setShowForm(true)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const productType = String(form.product_type || '').trim()
        const productVersion = String(form.product_version || '').trim()
        const productSeasonId = String(form.product_season_id || '').trim()
        const fabric = String(form.fabric || '').trim()
        const color = String(form.color || '').trim()
        const gender = String(form.gender || '').trim()
        const status = String(form.status || '').trim()

        if (!productType || !productVersion || !productSeasonId || !fabric || !color || !gender || !status) {
            alert('Product Type, Product Version, Product Season, Fabric, Color, Gender, and Status are required.')
            return
        }

        setSubmitting(true)
        const token   = localStorage.getItem('admin_token')

        // Compute total stock: sum of variant stocks if variants exist, else form.stock
        const totalStock = formVariants.length > 0
            ? formVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
            : parseInt(form.stock) || 0

        const variants = formVariants.map(v => ({
            option1_name:  v.option1_name,
            option1_value: v.option1_value,
            option2_name:  v.option2_name,
            option2_value: v.option2_value,
            option3_name:  v.option3_name  || '',
            option3_value: v.option3_value || '',
            price:         parseFloat(v.price) || parseFloat(form.price) || 0,
            inventory_qty: parseInt(v.stock) || 0,
            sku:           v.sku || '',
        }))

        const payload = {
            title:         form.title,
            description:   form.description,
            price:         parseFloat(form.price) || 0,
            compare_price: parseFloat(form.compare_price) || 0,
            category:      form.category,
            product_type:  productType,
            fabric:        fabric,
            color:         color,
            gender:        gender,
            tags:          form.tags.split(',').map(t => t.trim()).filter(Boolean),
            stock:         totalStock,
            images:        formImages
                .map(img => img.url)
                .filter((url) => typeof url === 'string' && url.trim() && !url.startsWith('blob:')),
            variants:      variants.length > 0 ? variants : null,
            product_version: productVersion,
            product_season_id: Number(productSeasonId),
            status,
            is_active: status === 'active',
        }

        const method = editingId ? 'PUT' : 'POST'
        if (editingId) payload.id = editingId

        try {
            const res  = await fetch(productsApiBase, {
                method,
                headers: getActorHeaders(true),
                body:    JSON.stringify(payload)
            })
            const data = await readApiJson(res)
            if (data.success) {
                setShowForm(false)
                resetForm()
                setPage(1)
                fetchProducts()
            } else {
                alert('Error: ' + data.error)
            }
        } catch (err) {
            alert('Error: ' + err.message)
        }
        setSubmitting(false)
    }

    async function handleDelete(id) {
        const token = localStorage.getItem('admin_token')
        try {
            const res  = await fetch(productsApiBase + '?id=' + id, {
                method:  'DELETE',
                headers: getActorHeaders(false)
            })
            const data = await readApiJson(res)
            if (data.success) {
                setDeleteConfirm(null)
                fetchProducts()
            } else {
                alert('Error: ' + data.error)
            }
        } catch (err) {
            alert('Error: ' + err.message)
        }
    }

    async function handleBulkSetDraft() {
        if (selectedIds.length === 0) return
        if (!window.confirm('Set ' + selectedIds.length + ' selected product(s) to Draft?')) return

        const token = localStorage.getItem('admin_token') || ''
        setBulkProcessing(true)
        try {
            await Promise.all(selectedIds.map(async (id) => {
                const res = await fetch(productsApiBase, {
                    method: 'PUT',
                    headers: getActorHeaders(true),
                    body: JSON.stringify({ id, is_active: false }),
                })
                const data = await readApiJson(res)
                if (!res.ok || !data.success) {
                    throw new Error(data.error || ('Failed for product ' + id))
                }
            }))
            clearSelection()
            fetchProducts()
        } catch (err) {
            alert('Bulk draft failed: ' + (err.message || 'Unknown error'))
        }
        setBulkProcessing(false)
    }

    async function handleBulkDelete() {
        if (selectedIds.length === 0) return
        if (!window.confirm('Delete ' + selectedIds.length + ' selected product(s)? This cannot be undone.')) return

        const token = localStorage.getItem('admin_token') || ''
        setBulkProcessing(true)
        try {
            await Promise.all(selectedIds.map(async (id) => {
                const res = await fetch(productsApiBase + '?id=' + id, {
                    method: 'DELETE',
                    headers: getActorHeaders(false),
                })
                const data = await readApiJson(res)
                if (!res.ok || !data.success) {
                    throw new Error(data.error || ('Failed for product ' + id))
                }
            }))
            clearSelection()
            fetchProducts()
        } catch (err) {
            alert('Bulk delete failed: ' + (err.message || 'Unknown error'))
        }
        setBulkProcessing(false)
    }

    async function handleBulkEditSubmit() {
        if (selectedIds.length === 0) return

        const updates = {}
        if (bulkEditForm.title.trim()) updates.title = bulkEditForm.title.trim()
        if (bulkEditForm.category) updates.category = bulkEditForm.category
        if (bulkEditForm.product_type) updates.product_type = bulkEditForm.product_type
        if (bulkEditForm.fabric) updates.fabric = bulkEditForm.fabric
        if (bulkEditForm.product_season_id) updates.product_season_id = Number(bulkEditForm.product_season_id)
        if (bulkEditForm.product_version) updates.product_version = bulkEditForm.product_version
        if (bulkEditForm.status) updates.is_active = bulkEditForm.status === 'active'

        if (Object.keys(updates).length === 0) {
            alert('Select at least one field to update in bulk edit.')
            return
        }

        const token = localStorage.getItem('admin_token') || ''
        setBulkProcessing(true)
        try {
            await Promise.all(selectedIds.map(async (id) => {
                const res = await fetch(productsApiBase, {
                    method: 'PUT',
                    headers: getActorHeaders(true),
                    body: JSON.stringify({ id, ...updates }),
                })
                const data = await readApiJson(res)
                if (!res.ok || !data.success) {
                    throw new Error(data.error || ('Failed for product ' + id))
                }
            }))
            setBulkEditOpen(false)
            setBulkEditForm({ title: '', category: '', product_type: '', fabric: '', product_season_id: '', product_version: '', status: '' })
            clearSelection()
            fetchProducts()
        } catch (err) {
            alert('Bulk edit failed: ' + (err.message || 'Unknown error'))
        }
        setBulkProcessing(false)
    }

    async function handleRecentBackgroundRemoval() {
        if (!window.confirm('Remove background and set white background for all product images uploaded in last 5 days?')) return

        setRecentBgRemoving(true)
        try {
            const res = await fetch('/api/admin/products/recent-background-removal', {
                method: 'POST',
                headers: getActorHeaders(true),
                body: JSON.stringify({ days: 5 }),
            })
            const data = await readApiJson(res)
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to process recent images')
            }
            const summary = 'Processed ' + (data.processedImages || 0) + ' image(s) across ' + (data.processedProducts || 0) + ' product(s).'
            alert(summary)
            fetchProducts()
        } catch (err) {
            alert('Recent background removal failed: ' + (err.message || 'Unknown error'))
        }
        setRecentBgRemoving(false)
    }



    async function handleImageUpload(e) {
        const files = e.target.files
        if (!files) return

        const selectedFiles = Array.from(files)
        const uploadItems = selectedFiles.map((file, idx) => {
            const tempId = String(Date.now()) + '_' + String(idx) + '_' + Math.random().toString(36).slice(2, 8)
            return {
                tempId,
                file,
                previewUrl: URL.createObjectURL(file),
            }
        })

        setFormImages(prev => [
            ...prev,
            ...uploadItems.map((item) => ({ url: item.previewUrl, uploading: true, tempId: item.tempId })),
        ])

        await Promise.all(uploadItems.map(async (item) => {
            try {
                const formData = new FormData()
                formData.append('file', item.file)

                const res = await fetch('/api/admin/upload-image', {
                    method: 'POST',
                    body: formData
                })
                const data = await readApiJson(res)
                if (res.ok && data.success && data.url) {
                    setFormImages(prev => prev.map((img) =>
                        img.tempId === item.tempId
                            ? { url: data.url, uploading: false, storagePath: data.storagePath || '' }
                            : img
                    ))
                } else {
                    setFormImages(prev => prev.filter((img) => img.tempId !== item.tempId))
                    alert('Image upload failed: ' + (data.error || ('HTTP ' + res.status)))
                }
            } catch (err) {
                setFormImages(prev => prev.filter((img) => img.tempId !== item.tempId))
                alert('Image upload failed: ' + err.message)
            } finally {
                URL.revokeObjectURL(item.previewUrl)
            }
        }))

        e.target.value = ''
    }

    function openImageEditor(idx) {
        if (!formImages[idx]) return
        setImageEditor({
            open: true,
            index: idx,
            rotate: 0,
            flipHorizontal: false,
            flipVertical: false,
            fit: 'contain',
            background: '#ffffff',
            removeBackground: false,
            saving: false,
        })
    }

    function closeImageEditor() {
        setImageEditor(prev => ({ ...prev, open: false, saving: false }))
    }

    async function applyImageEdit() {
        if (imageEditor.index === null) return
        const imgObj = formImages[imageEditor.index]
        if (!imgObj) return

        setRotatingIdx(imageEditor.index)
        setImageEditor(prev => ({ ...prev, saving: true }))
        const token = localStorage.getItem('admin_token')
        try {
            const res = await fetch('/api/admin/edit-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                body: JSON.stringify({
                    url: imgObj.url,
                    rotate: imageEditor.rotate,
                    flipHorizontal: imageEditor.flipHorizontal,
                    flipVertical: imageEditor.flipVertical,
                    fit: imageEditor.fit,
                    background: imageEditor.background,
                    removeBackground: imageEditor.removeBackground,
                })
            })
            const data = await readApiJson(res)
            if (data.success && data.url) {
                setFormImages(prev => prev.map((img, i) => i === imageEditor.index ? { url: data.url } : img))
                closeImageEditor()
            } else {
                alert('Image edit failed: ' + (data.error || 'Unknown'))
            }
        } catch (err) {
            alert('Image edit failed: ' + err.message)
        }
        setRotatingIdx(null)
        setImageEditor(prev => ({ ...prev, saving: false }))
    }

    function removeFormImage(idx) {
        setFormImages(prev => {
            const imageToRemove = prev[idx]
            if (imageToRemove?.url && imageToRemove.url.startsWith('blob:')) {
                URL.revokeObjectURL(imageToRemove.url)
            }
            return prev.filter((_, i) => i !== idx)
        })
    }

    function moveFormImage(idx, dir) {
        setFormImages(prev => {
            const next = [...prev]
            const swap = idx + dir
            if (swap < 0 || swap >= next.length) return next
            ;[next[idx], next[swap]] = [next[swap], next[idx]]
            return next
        })
    }

    function addVariant() {
        const opt1Name = formVariants.length > 0 ? formVariants[0].option1_name : 'Size'
        setFormVariants(prev => [...prev, {
            option1_name: opt1Name, option1_value: '',
            option2_name: '', option2_value: '',
            option3_name: '', option3_value: '',
            price: form.price || '', stock: '', sku: ''
        }])
    }

    function updateVariant(idx, field, value) {
        const nextValue = normalizeVariantInputValue(field, value)
        setFormVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: nextValue } : v))
    }

    function removeVariant(idx) {
        setFormVariants(prev => prev.filter((_, i) => i !== idx))
    }

    function addSizeVariants(sizes) {
        const opt1Name = formVariants.length > 0 ? formVariants[0].option1_name : 'Size'
        const existingValues = new Set(formVariants.map(v => v.option1_value))
        const newVariants = sizes
            .filter(s => !existingValues.has(s))
            .map(s => ({
                option1_name: opt1Name, option1_value: s,
                option2_name: '', option2_value: '',
                option3_name: '', option3_value: '',
                price: form.price || '', stock: '', sku: ''
            }))
        setFormVariants(prev => [...prev, ...newVariants])
    }

    function logout() {
        localStorage.removeItem('admin_token')
        router.push('/admin')
    }

    const variantFilterOptions = Array.from(new Set([
        ...COMMON_SIZES.map(normalizeVariantLabel),
        ...products.flatMap(getProductVariantValues),
    ])).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    )
    const filtered  = products
    const maxPages  = Math.ceil(total / 20)

    if (!verified) return (
        <div className="min-h-screen bg-cream flex items-center justify-center">
            <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-cream">
            {/* Header */}
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Products</h1>
                    <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{total}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/products/bulk-images" className="px-4 py-2 bg-purple-600 text-white font-display text-sm rounded-full hover:bg-purple-700">
                        🖼️ Bulk Images
                    </Link>
                    {!showForm && (
                        <button
                            type="button"
                            onClick={handleRecentBackgroundRemoval}
                            disabled={recentBgRemoving || bulkProcessing}
                            className="px-4 py-2 bg-emerald-600 text-white font-display text-sm rounded-full hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {recentBgRemoving ? 'Removing BG...' : '⚡ Remove BG (Last 5 Days)'}
                        </button>
                    )}
                    <button onClick={() => { resetForm(); setShowForm(!showForm) }}
                            className="px-5 py-2 bg-coral text-white font-display text-sm rounded-full hover:bg-opacity-90">
                        {showForm ? '← Back' : '+ Add Product'}
                    </button>
                    <button onClick={logout} className="text-sm text-gray-400 hover:text-coral">Logout →</button>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {showForm ? (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <h2 className="font-display text-xl text-charcoal mb-6">
                            {editingId ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* ── Basic Info ── */}
                            <div>
                                <h3 className="font-semibold text-sm text-charcoal mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-coral/10 text-coral rounded-full text-xs flex items-center justify-center font-bold">1</span>
                                    Basic Info
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block font-semibold text-xs text-charcoal mb-1">Product Title *</label>
                                        <input type="text" required value={form.title}
                                               onChange={e => setForm({...form, title: e.target.value})}
                                               placeholder="e.g. Kids Summer T-Shirt 2026"
                                               className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-xs text-charcoal mb-1">Category *</label>
                                        <select required value={form.category}
                                                onChange={e => setForm({...form, category: e.target.value})}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm">
                                            <option value="">Select category</option>
                                            {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-xs text-charcoal mb-1">Product Season *</label>
                                        <select required value={form.product_season_id}
                                                onChange={e => setForm({...form, product_season_id: e.target.value})}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm">
                                            <option value="">Select season</option>
                                            {productSeasonOptions.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                                                            <label className="block font-semibold text-xs text-charcoal mb-1">Product Version *</label>
                                                                            <select required value={form.product_version}
                                                                                    onChange={e => setForm({...form, product_version: e.target.value})}
                                                                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm">
                                                                                <option value="">Select version</option>
                                                                                {productVersionOptions.map((version) => <option key={version} value={version}>{version}</option>)}
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block font-semibold text-xs text-charcoal mb-1">Status *</label>
                                                                            <select required value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                                                                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm">
                                                                                <option value="">Select status</option>
                                                                                <option value="active">Active</option>
                                                                                <option value="draft">Draft</option>
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block font-semibold text-xs text-charcoal mb-1">Product Type *</label>
                                                                            <select required value={form.product_type}
                                                                                    onChange={e => setForm({...form, product_type: e.target.value})}
                                                                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm">
                                                                                <option value="">Select product type</option>
                                                                                {productTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block font-semibold text-xs text-charcoal mb-1">Fabric *</label>
                                                                            <select required value={form.fabric}
                                                                                    onChange={e => setForm({...form, fabric: e.target.value})}
                                                                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm">
                                                                                <option value="">Select fabric</option>
                                                                                {fabricOptions.map((fabric) => <option key={fabric} value={fabric}>{fabric}</option>)}
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block font-semibold text-xs text-charcoal mb-1">Color *</label>
                                                                            <select required value={form.color}
                                                                                    onChange={e => setForm({...form, color: e.target.value})}
                                                                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm">
                                                                                <option value="">Select color</option>
                                                                                {DEFAULT_COLOR_OPTIONS.map((color) => <option key={color} value={color}>{color}</option>)}
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block font-semibold text-xs text-charcoal mb-1">Gender *</label>
                                                                            <select required value={form.gender}
                                                                                    onChange={e => setForm({...form, gender: e.target.value})}
                                                                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm">
                                                                                <option value="">Select gender</option>
                                                                                {DEFAULT_GENDER_OPTIONS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
                                                                            </select>
                                                                        </div>
                                    <div className="md:col-span-2">
                                        <label className="block font-semibold text-xs text-charcoal mb-1">Description</label>
                                        <textarea value={form.description}
                                                  onChange={e => setForm({...form, description: e.target.value})}
                                                  placeholder="Product description..."
                                                  rows={3}
                                                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm resize-none" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block font-semibold text-xs text-charcoal mb-1">Tags (comma separated)</label>
                                        <input type="text" value={form.tags}
                                               onChange={e => setForm({...form, tags: e.target.value})}
                                               placeholder="boy, summer, 4-5 year, new arrival 2026"
                                               className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                    </div>
                                </div>
                            </div>

                            {/* ── Pricing & Stock ── */}
                            <div>
                                <h3 className="font-semibold text-sm text-charcoal mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-coral/10 text-coral rounded-full text-xs flex items-center justify-center font-bold">2</span>
                                    Pricing & Stock
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block font-semibold text-xs text-charcoal mb-1">Price (PKR) *</label>
                                        <input type="number" required value={form.price}
                                               onChange={e => setForm({...form, price: e.target.value})}
                                               placeholder="1999"
                                               className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-xs text-charcoal mb-1">Compare Price (PKR)</label>
                                        <input type="number" value={form.compare_price}
                                               onChange={e => setForm({...form, compare_price: e.target.value})}
                                               placeholder="2999 (optional)"
                                               className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-xs text-charcoal mb-1">
                                            {formVariants.length > 0 ? 'Total Stock (auto-calculated)' : 'Stock *'}
                                        </label>
                                        {formVariants.length > 0 ? (
                                            <div className="px-4 py-3 rounded-xl border-2 border-gray-100 text-sm font-bold text-green-600 bg-gray-50">
                                                {formVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)} units
                                            </div>
                                        ) : (
                                            <input type="number" required value={form.stock}
                                                   onChange={e => setForm({...form, stock: e.target.value})}
                                                   placeholder="10"
                                                   className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Variants / Sizes ── */}
                            <div>
                                <h3 className="font-semibold text-sm text-charcoal mb-1 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-coral/10 text-coral rounded-full text-xs flex items-center justify-center font-bold">3</span>
                                    Variants &amp; Sizes
                                    <span className="text-xs text-gray-400 font-normal ml-1">({formVariants.length} variant{formVariants.length !== 1 ? 's' : ''})</span>
                                </h3>
                                <p className="text-xs text-gray-400 mb-3">Add size/color variants. Each can have its own stock and price override.</p>

                                {/* Quick size add */}
                                <div className="mb-3 p-3 bg-cream rounded-xl">
                                    <p className="text-xs font-semibold text-charcoal mb-2">Quick add sizes:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {COMMON_SIZES.map(s => {
                                            const already = formVariants.some(v => v.option1_value === s)
                                            return (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => !already && addSizeVariants([s])}
                                                    className={`px-2 py-1 text-xs rounded-lg border font-semibold transition-colors ${already ? 'bg-coral/20 border-coral text-coral' : 'bg-white border-gray-200 text-gray-500 hover:border-coral hover:text-coral'}`}
                                                >
                                                    {already ? '✓ ' : ''}{s}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {formVariants.length > 0 && (
                                    <div className="overflow-x-auto mb-3">
                                        <table className="w-full text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-cream">
                                                    <th className="px-3 py-2 text-left font-semibold text-charcoal">Option (e.g. Size)</th>
                                                    <th className="px-3 py-2 text-left font-semibold text-charcoal">Value</th>
                                                    <th className="px-3 py-2 text-left font-semibold text-charcoal">Option2</th>
                                                    <th className="px-3 py-2 text-left font-semibold text-charcoal">Value2</th>
                                                    <th className="px-3 py-2 text-left font-semibold text-charcoal">Price</th>
                                                    <th className="px-3 py-2 text-left font-semibold text-charcoal">Stock</th>
                                                    <th className="px-3 py-2 text-left font-semibold text-charcoal">SKU</th>
                                                    <th className="px-3 py-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formVariants.map((v, i) => (
                                                    <tr key={i} className="border-b border-gray-100">
                                                        <td className="px-2 py-1.5">
                                                            <input value={v.option1_name} onChange={e => updateVariant(i, 'option1_name', e.target.value)}
                                                                   placeholder="Size"
                                                                   className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-coral focus:outline-none" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <input value={v.option1_value} onChange={e => updateVariant(i, 'option1_value', e.target.value)}
                                                                   placeholder="e.g. 2-3Y"
                                                                   className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-coral focus:outline-none" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <input value={v.option2_name} onChange={e => updateVariant(i, 'option2_name', e.target.value)}
                                                                   placeholder="Color"
                                                                   className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-coral focus:outline-none" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <input value={v.option2_value} onChange={e => updateVariant(i, 'option2_value', e.target.value)}
                                                                   placeholder="e.g. Red"
                                                                   className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-coral focus:outline-none" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <input type="number" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)}
                                                                   placeholder={form.price || '—'}
                                                                   className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-coral focus:outline-none" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <input type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)}
                                                                   placeholder="0"
                                                                   className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-coral focus:outline-none" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <input value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)}
                                                                   placeholder="SKU-001"
                                                                   className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-coral focus:outline-none" />
                                                        </td>
                                                        <td className="px-2 py-1.5">
                                                            <button type="button" onClick={() => removeVariant(i)}
                                                                    className="text-red-400 hover:text-red-600 font-bold text-sm">✕</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <button type="button" onClick={addVariant}
                                        className="px-4 py-2 text-xs bg-charcoal/10 text-charcoal rounded-xl hover:bg-charcoal/20 font-semibold">
                                    + Add Variant Row
                                </button>
                            </div>

                            {/* ── Images ── */}
                            <div>
                                <h3 className="font-semibold text-sm text-charcoal mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-coral/10 text-coral rounded-full text-xs flex items-center justify-center font-bold">4</span>
                                    Product Images
                                    <span className="text-xs text-gray-400 font-normal ml-1">({formImages.length} image{formImages.length !== 1 ? 's' : ''})</span>
                                </h3>

                                {/* Image thumbnails grid */}
                                {formImages.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                                        {formImages.map((imgObj, idx) => (
                                            <div key={idx} className="rounded-xl border border-gray-100 p-2 bg-gray-50">
                                                <div className="relative aspect-square">
                                                    <img
                                                        src={imgObj.url}
                                                        alt={`Image ${idx + 1}`}
                                                        className={`w-full h-full object-cover rounded-lg border-2 ${idx === 0 ? 'border-coral' : 'border-gray-100'} transition-opacity ${rotatingIdx === idx ? 'opacity-50' : ''}`}
                                                        onError={e => e.target.style.opacity = '0.2'}
                                                    />
                                                    {idx === 0 && (
                                                        <span className="absolute top-1 left-1 bg-coral text-white text-xs px-1.5 py-0.5 rounded-md font-bold">Main</span>
                                                    )}
                                                    {rotatingIdx === idx && (
                                                        <div className="absolute inset-0 rounded-lg bg-black/30 flex items-center justify-center">
                                                            <span className="text-white text-lg animate-spin">↻</span>
                                                        </div>
                                                    )}
                                                    {imgObj.uploading && (
                                                        <div className="absolute inset-0 rounded-lg bg-black/45 flex items-center justify-center">
                                                            <span className="text-white text-xs font-semibold">Uploading...</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-2 grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openImageEditor(idx)}
                                                        disabled={imgObj.uploading}
                                                        className="col-span-2 px-2 py-1.5 bg-charcoal text-white text-xs rounded-lg hover:bg-charcoal/90"
                                                    >
                                                        Edit Image
                                                    </button>
                                                    {idx > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => moveFormImage(idx, -1)}
                                                            disabled={imgObj.uploading}
                                                            className="px-2 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-lg hover:bg-blue-100"
                                                        >
                                                            Move Left
                                                        </button>
                                                    )}
                                                    {idx < formImages.length - 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => moveFormImage(idx, 1)}
                                                            disabled={imgObj.uploading}
                                                            className="px-2 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-lg hover:bg-blue-100"
                                                        >
                                                            Move Right
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFormImage(idx)}
                                                        disabled={imgObj.uploading}
                                                        className="col-span-2 px-2 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upload */}
                                <div className="flex gap-2 items-center mb-2">
                                    <label className="flex-1 cursor-pointer px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-coral text-sm text-gray-400 hover:text-coral text-center transition-colors">
                                        + Upload Images (auto-optimize to WebP)
                                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-400">First image is the main/thumbnail · Use Edit Image for larger image controls</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={submitting}
                                        className="flex-1 px-5 py-3 bg-coral text-white font-display rounded-xl hover:bg-opacity-90 disabled:opacity-50">
                                    {submitting ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
                                </button>
                                <button type="button" onClick={() => { setShowForm(false); resetForm() }}
                                        className="px-5 py-3 bg-gray-200 text-charcoal font-display rounded-xl hover:bg-gray-300">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>

                ) : (
                    <>
                        {loadError && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                {loadError}
                            </div>
                        )}
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                            <input type="text" placeholder="🔍 Search products..."
                                   value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                   className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm bg-white"
                            >
                                <option value="all">All Categories</option>
                                {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <select
                                value={variantFilter}
                                onChange={e => setVariantFilter(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm bg-white"
                            >
                                <option value="all">All Variants / Sizes</option>
                                {variantFilterOptions.map((variant) => (
                                    <option key={variant} value={variant}>{variant}</option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="w-full px-3 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm bg-white"
                                >
                                    <option value="created_at">Created At</option>
                                    <option value="updated_at">Updated At</option>
                                    <option value="created_at">Product Added By</option>
                                    <option value="price">Price</option>
                                    <option value="title">Title</option>
                                    <option value="category">Category</option>
                                    <option value="variant_count">Variants</option>
                                    <option value="stock">Stock</option>
                                    <option value="is_active">Status</option>
                                </select>
                                <select
                                    value={sortDir}
                                    onChange={e => setSortDir(e.target.value)}
                                    className="w-full px-3 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm bg-white"
                                >
                                    <option value="desc">New → Old</option>
                                    <option value="asc">Old → New</option>
                                </select>
                            </div>
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3 flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-charcoal">{selectedIds.length} selected</span>
                                <button
                                    type="button"
                                    onClick={() => setBulkEditOpen(true)}
                                    disabled={bulkProcessing}
                                    className="px-3 py-1.5 bg-charcoal text-white text-xs rounded-lg hover:bg-charcoal/90 disabled:opacity-50"
                                >
                                    Bulk Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkSetDraft}
                                    disabled={bulkProcessing}
                                    className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 disabled:opacity-50"
                                >
                                    Set As Draft
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    disabled={bulkProcessing}
                                    className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-50"
                                >
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    disabled={bulkProcessing}
                                    className="px-3 py-1.5 bg-gray-200 text-charcoal text-xs rounded-lg hover:bg-gray-300 disabled:opacity-50"
                                >
                                    Clear
                                </button>
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-8 text-gray-400 animate-pulse">Loading products...</div>
                        ) : filtered.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
                                <p className="text-4xl mb-2">📦</p>
                                <p>No products found</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-cream border-b-2 border-gray-100">
                                            <tr>
                                                <th className="px-3 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={filtered.length > 0 && filtered.every(p => selectedIds.includes(p.id))}
                                                        onChange={() => toggleSelectAllProducts(filtered)}
                                                        className="w-4 h-4 accent-coral"
                                                        aria-label="Select all products"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm">{renderSortableHeader('Product', 'title')}</th>
                                                <th className="px-4 py-3 text-left text-sm">{renderSortableHeader('Category', 'category')}</th>
                                                <th className="px-4 py-3 text-left text-sm">{renderSortableHeader('Price', 'price')}</th>
                                                <th className="px-4 py-3 text-left text-sm">{renderSortableHeader('Variants', 'variant_count')}</th>
                                                <th className="px-4 py-3 text-left text-sm">{renderSortableHeader('Stock', 'stock')}</th>
                                                <th className="px-4 py-3 text-left text-sm">{renderSortableHeader('Status', 'is_active')}</th>
                                                <th className="px-4 py-3 text-left text-xs">{renderSortableHeader('Product Added By', 'created_at')}</th>
                                                <th className="px-4 py-3 text-center font-semibold text-sm text-charcoal">Actions</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {filtered.map(product => {
                                                const firstImage = normalizeImages(product.images)[0]
                                                return (
                                                <tr key={product.id} className={'border-b border-gray-100 transition-colors ' + (selectedIds.includes(product.id) ? 'bg-coral/5' : 'hover:bg-cream')}>
                                                    <td className="px-3 py-3 text-center align-top">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(product.id)}
                                                            onChange={() => toggleSelectProduct(product.id)}
                                                            className="w-4 h-4 accent-coral"
                                                            aria-label={'Select ' + product.title}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            {firstImage && (
                                                                <img src={firstImage}
                                                                     alt={product.title} className="w-10 h-10 object-cover rounded-lg"
                                                                     onError={e => e.target.style.display = 'none'} />
                                                            )}
                                                            <div>
                                                                <p className="font-semibold text-sm text-charcoal">{product.title}</p>
                                                                <p className="text-xs text-gray-400">{product.product_type}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{product.category}</td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-coral">PKR {product.price?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {Array.isArray(product.variants) && product.variants.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1 max-w-[140px]">
                                                                {product.variants.slice(0, 5).map((v, i) => (
                                                                    <span key={i} className="px-1.5 py-0.5 bg-skyblue/20 text-charcoal text-xs rounded font-medium">
                                                                        {v.option1_value || v.title || '?'}
                                                                    </span>
                                                                ))}
                                                                {product.variants.length > 5 && (
                                                                    <span className="text-xs text-gray-400">+{product.variants.length - 5}</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-300 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                              <span className={product.stock > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                {product.stock}
                              </span>
                                                    </td>
                                                   <td className="px-4 py-3 text-sm text-gray-500">
                                                           <div className="flex items-center gap-2">
                                                               <button type="button" role="switch"
                                                                       aria-checked={!!product.is_active}
                                                                       onClick={() => toggleStatus(product)}
                                                                       title={product.is_active ? 'Active — click to set Draft' : 'Draft — click to set Active'}
                                                                       className={'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ' +
                                                                           (product.is_active ? 'bg-green-500' : 'bg-gray-300')}>
                                                                   <span className={'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ' +
                                                                       (product.is_active ? 'translate-x-5' : 'translate-x-1')} />
                                                               </button>
                                                               <span className={product.is_active ? 'text-green-600 font-semibold' : 'text-gray-400 font-semibold'}>
                                                                   {product.is_active ? 'Active' : 'Draft'}
                                                               </span>
                                                           </div>
                                                   </td>
                                                   <td className="px-4 py-3 text-xs text-gray-500">
                                                           <div className="space-y-1">
                                                               <p>{formatProductActor(product.last_action_by)}</p>
                                                               <p className="text-gray-400">{product.created_at ? new Date(product.created_at).toLocaleDateString() : '—'}</p>
                                                           </div>
                                                   </td>
                                                   <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => openEdit(product)}
                                                                    className="px-3 py-1 text-xs bg-skyblue/20 text-charcoal rounded-lg hover:bg-skyblue/40">
                                                                Edit
                                                            </button>
                                                            <button onClick={() => handleDuplicate(product)}
                                                                    disabled={duplicatingId === product.id}
                                                                    className="px-3 py-1 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 disabled:opacity-50">
                                                                {duplicatingId === product.id ? 'Duplicating...' : 'Duplicate'}
                                                            </button>
                                                            <button onClick={() => setDeleteConfirm(product.id)}
                                                                    className="px-3 py-1 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                )
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {maxPages > 1 && (
                                    <div className="mt-6 flex items-center justify-center gap-2">
                                        <button onClick={() => setPage(Math.max(1, page-1))} disabled={page === 1}
                                                className="px-4 py-2 text-sm bg-charcoal text-white rounded-xl disabled:opacity-50">← Prev</button>
                                        <span className="text-sm font-semibold text-charcoal">Page {page} of {maxPages}</span>
                                        <button onClick={() => setPage(Math.min(maxPages, page+1))} disabled={page === maxPages}
                                                className="px-4 py-2 text-sm bg-charcoal text-white rounded-xl disabled:opacity-50">Next →</button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {imageEditor.open && imageEditor.index !== null && formImages[imageEditor.index] && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60" onClick={closeImageEditor} />
                    <div className="relative bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-5">
                        <div className="lg:col-span-3 bg-gray-100 p-4 flex items-center justify-center">
                            <div
                                className="w-full max-w-2xl aspect-square rounded-xl overflow-hidden border border-gray-200"
                                style={imageEditor.fit === 'contain' ? getEditorPreviewBackgroundStyle(imageEditor.background) : { background: '#f3f4f6' }}
                            >
                                <img
                                    src={formImages[imageEditor.index].url}
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

                                <button
                                    type="button"
                                    onClick={() => setImageEditor(prev => {
                                        const nextEnabled = !prev.removeBackground
                                        return {
                                            ...prev,
                                            removeBackground: nextEnabled,
                                            background: nextEnabled ? '#ffffff' : prev.background,
                                        }
                                    })}
                                    className={'block w-full text-center px-3 py-2 text-sm rounded-lg ' + (imageEditor.removeBackground ? 'bg-purple-700 text-white' : 'bg-purple-500 text-white hover:bg-purple-600')}
                                >
                                    {imageEditor.removeBackground ? 'Background Removal: ON' : 'Enable Background Removal'}
                                </button>
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
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative bg-white rounded-2xl p-6 max-w-sm shadow-2xl">
                        <h3 className="font-display text-lg text-charcoal mb-2">Delete Product?</h3>
                        <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
                        <div className="flex gap-2">
                            <button onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-opacity-90">
                                Delete
                            </button>
                            <button onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-charcoal text-sm font-semibold rounded-xl hover:bg-gray-300">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {bulkEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setBulkEditOpen(false)} />
                    <div className="relative bg-white rounded-2xl w-full max-w-md p-5 shadow-xl">
                        <h3 className="font-display text-xl text-charcoal mb-2">Bulk Edit Products</h3>
                        <p className="text-sm text-gray-500 mb-4">Updating {selectedIds.length} selected product(s)</p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-charcoal mb-1">Title</label>
                                <input
                                    type="text"
                                    value={bulkEditForm.title}
                                    onChange={e => setBulkEditForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-coral text-sm"
                                    placeholder="No change"
                                />
                                <p className="mt-1 text-[11px] text-gray-500">If set, the same title is applied to all selected products.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-charcoal mb-1">Category</label>
                                <select
                                    value={bulkEditForm.category}
                                    onChange={e => setBulkEditForm(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-coral text-sm"
                                >
                                    <option value="">No change</option>
                                    {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-charcoal mb-1">Product Version</label>
                                <select
                                    value={bulkEditForm.product_version}
                                    onChange={e => setBulkEditForm(prev => ({ ...prev, product_version: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-coral text-sm"
                                >
                                    <option value="">No change</option>
                                    {productVersionOptions.map((version) => <option key={version} value={version}>{version}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-charcoal mb-1">Product Type</label>
                                <select
                                    value={bulkEditForm.product_type}
                                    onChange={e => setBulkEditForm(prev => ({ ...prev, product_type: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-coral text-sm"
                                >
                                    <option value="">No change</option>
                                    {productTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-charcoal mb-1">Fabric</label>
                                <select
                                    value={bulkEditForm.fabric}
                                    onChange={e => setBulkEditForm(prev => ({ ...prev, fabric: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-coral text-sm"
                                >
                                    <option value="">No change</option>
                                    {DEFAULT_FABRIC_OPTIONS.map((fabric) => <option key={fabric} value={fabric}>{fabric}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-charcoal mb-1">Product Season</label>
                                <select
                                    value={bulkEditForm.product_season_id}
                                    onChange={e => setBulkEditForm(prev => ({ ...prev, product_season_id: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-coral text-sm"
                                >
                                    <option value="">No change</option>
                                    {productSeasonOptions.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-charcoal mb-1">Status</label>
                                <select
                                    value={bulkEditForm.status}
                                    onChange={e => setBulkEditForm(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-coral text-sm"
                                >
                                    <option value="">No change</option>
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={handleBulkEditSubmit}
                                disabled={bulkProcessing}
                                className="px-4 py-2 bg-coral text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                            >
                                {bulkProcessing ? 'Applying...' : 'Apply Bulk Edit'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setBulkEditOpen(false)}
                                disabled={bulkProcessing}
                                className="px-4 py-2 bg-gray-200 text-charcoal text-sm font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}