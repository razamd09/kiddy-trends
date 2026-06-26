'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminProducts() {
    const [products, setProducts]     = useState([])
    const [loading, setLoading]       = useState(true)
    const [verified, setVerified]     = useState(false)
    const [showForm, setShowForm]     = useState(false)
    const [editingId, setEditingId]   = useState(null)
    const [page, setPage]             = useState(1)
    const [total, setTotal]           = useState(0)
    const [searchTerm, setSearchTerm] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [importFile, setImportFile] = useState(null)
    const [importing, setImporting] = useState(false)
    const [importSummary, setImportSummary] = useState(null)
    const [loadError, setLoadError] = useState('')
    const [syncing, setSyncing] = useState(false)
    const [syncResult, setSyncResult] = useState(null)
    const [form, setForm] = useState({
        title: '', description: '', price: '', compare_price: '',
        category: '', product_type: '', tags: '', stock: '', images: ''
    })
    const router = useRouter()

    const categories = ['Clothing', 'Bedding', 'Bags', 'Accessories', 'Footwear', 'Other']

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
            try {
                const res  = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await res.json()
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
    }, [verified, page])

    async function fetchProducts() {
        setLoading(true)
        setLoadError('')
        const token = localStorage.getItem('admin_token')
        try {
            const res  = await fetch('/api/admin/products?page=' + page, { headers: { 'x-admin-token': token } })
            const data = await res.json()
            if (!res.ok || data.error) {
                setProducts([])
                setTotal(0)
                setLoadError(data.error || 'Unable to load products')
            } else {
                setProducts(data.products || [])
                setTotal(data.total || 0)
            }
        } catch (err) {
            setProducts([])
            setTotal(0)
            setLoadError(err.message || 'Unable to load products')
        }
        setLoading(false)
    }

    function resetForm() {
        setForm({ title: '', description: '', price: '', compare_price: '', category: '', product_type: '', tags: '', stock: '', images: '' })
        setEditingId(null)
    }

    function openEdit(product) {
        setForm({
            title:         product.title || '',
            description:   product.description || '',
            price:         product.price || '',
            compare_price: product.compare_price || '',
            category:      product.category || '',
            product_type:  product.product_type || '',
            tags:          (product.tags || []).join(', '),
            stock:         product.stock || '',
            images:        (product.images || []).join('\n'),
        })
        setEditingId(product.id)
        setShowForm(true)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        const token   = localStorage.getItem('admin_token')
        const payload = {
            title:         form.title,
            description:   form.description,
            price:         parseFloat(form.price) || 0,
            compare_price: parseFloat(form.compare_price) || 0,
            category:      form.category,
            product_type:  form.product_type,
            tags:          form.tags.split(',').map(t => t.trim()).filter(Boolean),
            stock:         parseInt(form.stock) || 0,
            images:        form.images.split('\n').map(s => s.trim()).filter(Boolean),
        }

        const method = editingId ? 'PUT' : 'POST'
        if (editingId) payload.id = editingId

        try {
            const res  = await fetch('/api/admin/products', {
                method,
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                body:    JSON.stringify(payload)
            })
            const data = await res.json()
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
            const res  = await fetch('/api/admin/products?id=' + id, {
                method:  'DELETE',
                headers: { 'x-admin-token': token }
            })
            const data = await res.json()
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

    async function handleImportCsv() {
        if (!importFile) {
            setImportSummary({ error: 'Please select a CSV file first' })
            return
        }

        setImporting(true)
        setImportSummary(null)
        const token = localStorage.getItem('admin_token')
        try {
            const formData = new FormData()
            formData.append('file', importFile)

            const res = await fetch('/api/admin/products/import', {
                method: 'POST',
                headers: { 'x-admin-token': token || '' },
                body: formData,
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                setImportSummary({ error: data.error || 'Import failed' })
            } else {
                setImportSummary(data.summary)
                setImportFile(null)
                setPage(1)
                fetchProducts()
            }
        } catch (err) {
            setImportSummary({ error: err.message || 'Import failed' })
        }
        setImporting(false)
    }

    async function handleSyncImages() {
        setSyncing(true)
        setSyncResult(null)
        const token = localStorage.getItem('admin_token')
        try {
            const res = await fetch('/api/admin/sync-images', {
                method: 'POST',
                headers: { 'x-admin-token': token || '' }
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                setSyncResult({ error: data.error || 'Sync failed' })
            } else {
                setSyncResult(data.results)
                fetchProducts()
            }
        } catch (err) {
            setSyncResult({ error: err.message || 'Sync failed' })
        }
        setSyncing(false)
    }

    async function handleImageUpload(e) {
        const files = e.target.files
        if (!files) return

        for (const file of files) {
            try {
                const formData = new FormData()
                formData.append('file', file)

                const res = await fetch('/api/admin/upload-image', {
                    method: 'POST',
                    body: formData
                })
                const data = await res.json()
                if (data.success) {
                    const currentImages = form.images ? form.images.split('\n').filter(Boolean) : []
                    setForm({
                        ...form,
                        images: [...currentImages, data.url].join('\n')
                    })
                }
            } catch (err) {
                console.error('Upload failed:', err.message)
            }
        }
    }

    function logout() {
        localStorage.removeItem('admin_token')
        router.push('/admin')
    }

    const filtered  = products.filter(p => p.title?.toLowerCase().includes(searchTerm.toLowerCase()))
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
                    <button onClick={() => { resetForm(); setShowForm(!showForm) }}
                            className="px-5 py-2 bg-coral text-white font-display text-sm rounded-full hover:bg-opacity-90">
                        {showForm ? '← Back' : '+ Add Product'}
                    </button>
                    <button onClick={logout} className="text-sm text-gray-400 hover:text-coral">Logout →</button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!showForm && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 border border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-end gap-3">
                            <div className="flex-1">
                                <label className="block font-semibold text-sm text-charcoal mb-1">Import Shopify CSV</label>
                                <input
                                    type="file"
                                    accept=".csv,text/csv"
                                    onChange={e => {
                                        setImportSummary(null)
                                        setImportFile(e.target.files?.[0] || null)
                                    }}
                                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-100 text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">Upload full Shopify product export CSV. Existing handles are updated; new ones are created.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleImportCsv}
                                disabled={importing || !importFile}
                                className="px-5 py-2.5 bg-charcoal text-white font-display text-sm rounded-xl hover:bg-coral disabled:opacity-50"
                            >
                                {importing ? 'Importing...' : 'Import CSV'}
                            </button>
                        </div>

                        {importSummary?.error && (
                            <p className="text-sm text-red-500 mt-3">{importSummary.error}</p>
                        )}
                        {importSummary && !importSummary.error && (
                            <div className="mt-3 text-xs text-gray-600 bg-cream rounded-xl p-3">
                                <span className="font-semibold text-charcoal">Rows:</span> {importSummary.totalRows} ·{' '}
                                <span className="font-semibold text-charcoal">Valid:</span> {importSummary.validProducts} ·{' '}
                                <span className="font-semibold text-green-600">Inserted:</span> {importSummary.inserted} ·{' '}
                                <span className="font-semibold text-blue-600">Updated:</span> {importSummary.updated} ·{' '}
                                <span className="font-semibold text-red-500">Failed:</span> {importSummary.failed}
                                {importSummary.errors?.length > 0 && (
                                    <div className="mt-2 space-y-1 text-red-500">
                                        {importSummary.errors.slice(0, 5).map((e, i) => (
                                            <p key={i}>• {e.handle}: {e.error}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="mt-4 border-t pt-4">
                            <h3 className="font-semibold text-sm text-charcoal mb-3">🖼️ Image CDN Sync</h3>
                            <p className="text-xs text-gray-500 mb-3">Migrate all Shopify images to Supabase CDN for faster loading</p>
                            {syncResult && (
                                <div className="mb-3 text-xs text-gray-600 bg-cream rounded-xl p-3">
                                    {syncResult.error ? (
                                        <p className="text-red-500 font-semibold">{syncResult.error}</p>
                                    ) : (
                                        <>
                                            <span className="font-semibold text-charcoal">Sync Complete:</span> {syncResult.processed} migrated · {syncResult.failed} failed · {syncResult.skipped} skipped
                                            {syncResult.errors?.length > 0 && (
                                                <div className="mt-2 space-y-1 text-red-500">
                                                    {syncResult.errors.slice(0, 3).map((e, i) => (
                                                        <p key={i}>• {e.productId}: {e.error}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleSyncImages}
                                disabled={syncing}
                                className="px-4 py-2.5 bg-purple-600 text-white font-display text-sm rounded-xl hover:bg-purple-700 disabled:opacity-50"
                            >
                                {syncing ? 'Syncing Images...' : 'Sync All Images to CDN'}
                            </button>
                        </div>
                    </div>
                )}

                {showForm ? (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <h2 className="font-display text-xl text-charcoal mb-6">
                            {editingId ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-sm text-charcoal mb-1">Product Title *</label>
                                    <input type="text" required value={form.title}
                                           onChange={e => setForm({...form, title: e.target.value})}
                                           placeholder="e.g. Kids Summer T-Shirt 2026"
                                           className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block font-semibold text-sm text-charcoal mb-1">Category *</label>
                                    <select required value={form.category}
                                            onChange={e => setForm({...form, category: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm">
                                        <option value="">Select category</option>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-sm text-charcoal mb-1">Price (PKR) *</label>
                                    <input type="number" required value={form.price}
                                           onChange={e => setForm({...form, price: e.target.value})}
                                           placeholder="1999"
                                           className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block font-semibold text-sm text-charcoal mb-1">Compare Price (PKR)</label>
                                    <input type="number" value={form.compare_price}
                                           onChange={e => setForm({...form, compare_price: e.target.value})}
                                           placeholder="2999 (optional)"
                                           className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block font-semibold text-sm text-charcoal mb-1">Stock *</label>
                                    <input type="number" required value={form.stock}
                                           onChange={e => setForm({...form, stock: e.target.value})}
                                           placeholder="10"
                                           className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block font-semibold text-sm text-charcoal mb-1">Product Type</label>
                                    <input type="text" value={form.product_type}
                                           onChange={e => setForm({...form, product_type: e.target.value})}
                                           placeholder="e.g. T-Shirt"
                                           className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-sm text-charcoal mb-1">Description</label>
                                <textarea value={form.description}
                                          onChange={e => setForm({...form, description: e.target.value})}
                                          placeholder="Product description..."
                                          rows={3}
                                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm resize-none" />
                            </div>

                            <div>
                                <label className="block font-semibold text-sm text-charcoal mb-1">Tags (comma separated)</label>
                                <input type="text" value={form.tags}
                                       onChange={e => setForm({...form, tags: e.target.value})}
                                       placeholder="boy, summer, 4-5 year, new arrival 2026"
                                       className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                            </div>

                            <div>
                                <label className="block font-semibold text-sm text-charcoal mb-1">Product Images</label>
                                <div className="flex gap-2 mb-2">
                                    <input type="file" multiple accept="image/*"
                                           onChange={handleImageUpload}
                                           className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                    <span className="text-xs text-gray-400 px-2 py-3">Upload to CDN →</span>
                                </div>
                                <textarea value={form.images}
                                          onChange={e => setForm({...form, images: e.target.value})}
                                          placeholder={'https://cdn.supabase.co/...\nhttps://cdn.supabase.co/...'}
                                          rows={4}
                                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm resize-none font-mono text-xs" />
                                <p className="text-xs text-gray-400 mt-1">Upload images above (auto-optimized) or paste URLs — one per line</p>
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
                        <div className="mb-6">
                            <input type="text" placeholder="🔍 Search products..."
                                   value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                   className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                        </div>

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
                                                <th className="px-4 py-3 text-left font-semibold text-sm text-charcoal">Product</th>
                                                <th className="px-4 py-3 text-left font-semibold text-sm text-charcoal">Category</th>
                                                <th className="px-4 py-3 text-left font-semibold text-sm text-charcoal">Price</th>
                                                <th className="px-4 py-3 text-left font-semibold text-sm text-charcoal">Stock</th>
                                                <th className="px-4 py-3 text-center font-semibold text-sm text-charcoal">Actions</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {filtered.map(product => (
                                                <tr key={product.id} className="border-b border-gray-100 hover:bg-cream transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            {product.images?.[0] && (
                                                                <img src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].src}
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
                              <span className={product.stock > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                {product.stock}
                              </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => openEdit(product)}
                                                                    className="px-3 py-1 text-xs bg-skyblue/20 text-charcoal rounded-lg hover:bg-skyblue/40">
                                                                Edit
                                                            </button>
                                                            <button onClick={() => setDeleteConfirm(product.id)}
                                                                    className="px-3 py-1 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
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
        </div>
    )
}