'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUploader from '@/components/ImageUploader'

export default function AdminProducts() {
    const router = useRouter()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [searchTerm, setSearchTerm] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    
    const [form, setForm] = useState({
        title: '',
        description: '',
        price: '',
        compare_price: '',
        category: '',
        product_type: '',
        tags: '',
        stock: '',
        images: []
    })

    const categories = ['Clothing', 'Bedding', 'Bags', 'Accessories', 'Footwear', 'Other']

    useEffect(() => {
        fetchProducts()
    }, [page])

    async function fetchProducts() {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/products?page=${page}`)
            const data = await res.json()
            setProducts(data.products || [])
            setTotal(data.total || 0)
        } catch (err) {
            alert('Error loading products: ' + err.message)
        }
        setLoading(false)
    }

    function resetForm() {
        setForm({
            title: '',
            description: '',
            price: '',
            compare_price: '',
            category: '',
            product_type: '',
            tags: '',
            stock: '',
            images: []
        })
        setEditingId(null)
    }

    function openEdit(product) {
        setForm({
            title: product.title || '',
            description: product.description || '',
            price: product.price || '',
            compare_price: product.compare_price || '',
            category: product.category || '',
            product_type: product.product_type || '',
            tags: (product.tags || []).join(', '),
            stock: product.stock || '',
            images: (product.images || []).map(img => ({
                url: typeof img === 'string' ? img : img.src,
                path: typeof img === 'object' ? img.path : null
            }))
        })
        setEditingId(product.id)
        setShowForm(true)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (form.images.length === 0) {
            alert('Please upload at least one image')
            return
        }
        setSubmitting(true)

        try {
            const payload = {
                title: form.title,
                description: form.description,
                price: parseFloat(form.price) || 0,
                compare_price: parseFloat(form.compare_price) || 0,
                category: form.category,
                product_type: form.product_type,
                tags: form.tags.split(',').map(t => t.trim()).filter(t => t),
                stock: parseInt(form.stock) || 0,
                images: form.images.map(img => ({ src: img.url }))
            }

            if (editingId) {
                payload.id = editingId
                const res = await fetch('/api/admin/products', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                const data = await res.json()
                if (data.success) {
                    alert('Product updated!')
                    setShowForm(false)
                    resetForm()
                    fetchProducts()
                } else {
                    alert('Error: ' + data.error)
                }
            } else {
                const res = await fetch('/api/admin/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                const data = await res.json()
                if (data.success) {
                    alert('Product added!')
                    setShowForm(false)
                    resetForm()
                    setPage(1)
                    fetchProducts()
                } else {
                    alert('Error: ' + data.error)
                }
            }
        } catch (err) {
            alert('Error: ' + err.message)
        }
        setSubmitting(false)
    }

    async function handleDelete(id) {
        try {
            const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                alert('Product deleted!')
                setDeleteConfirm(null)
                fetchProducts()
            } else {
                alert('Error: ' + data.error)
            }
        } catch (err) {
            alert('Error: ' + err.message)
        }
    }

    const filteredProducts = products.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const maxPages = Math.ceil(total / 20)

    return (
        <div className="min-h-screen bg-cream">
            {/* Header */}
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl text-charcoal">Product Management</h1>
                    <p className="text-xs text-gray-400">Total: {total} products</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { resetForm(); setShowForm(!showForm) }}
                        className="px-5 py-2 bg-coral text-white font-display text-sm rounded-full hover:bg-opacity-90">
                        {showForm ? '← Back' : '+ Add Product'}
                    </button>
                    <Link href="/admin/dashboard"
                        className="px-5 py-2 bg-charcoal text-white font-display text-sm rounded-full hover:opacity-90">
                        ← Dashboard
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {showForm ? (
                    /* Add/Edit Form */
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <h2 className="font-display text-xl text-charcoal mb-6">
                            {editingId ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Title */}
                                <div>
                                    <label className="block font-semibold text-sm text-charcoal mb-1">Product Title *</label>
                                    <input type="text" required value={form.title}
                                        onChange={e => setForm({...form, title: e.target.value})}
                                        placeholder="e.g. Kids T-Shirt"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block font-semibold text-sm text-charcoal mb-1">Category *</label>
                                    <select required value={form.category}
                                        onChange={e => setForm({...form, category: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm">
                                        <option value="">Select category</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="block font-semibold text-sm text-charcoal mb-1">Price (PKR) *</label>
                                    <input type="number" required step="0.01" value={form.price}
                                        onChange={e => setForm({...form, price: e.target.value})}
                                        placeholder="1999"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                </div>

                                {/* Compare Price */}
                                <div>
                                    <label className="block font-semibold text-sm text-charcoal mb-1">Compare Price (PKR)</label>
                                    <input type="number" step="0.01" value={form.compare_price}
                                        onChange={e => setForm({...form, compare_price: e.target.value})}
                                        placeholder="2999 (optional)"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                </div>

                                {/* Stock */}
                                <div>
                                    <label className="block font-semibold text-sm text-charcoal mb-1">Stock *</label>
                                    <input type="number" required value={form.stock}
                                        onChange={e => setForm({...form, stock: e.target.value})}
                                        placeholder="0"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                </div>

                                {/* Product Type */}
                                <div>
                                    <label className="block font-semibold text-sm text-charcoal mb-1">Product Type</label>
                                    <input type="text" value={form.product_type}
                                        onChange={e => setForm({...form, product_type: e.target.value})}
                                        placeholder="e.g. T-Shirt"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block font-semibold text-sm text-charcoal mb-1">Description *</label>
                                <textarea required value={form.description}
                                    onChange={e => setForm({...form, description: e.target.value})}
                                    placeholder="Product description..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm resize-none" />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block font-semibold text-sm text-charcoal mb-1">Tags (comma-separated)</label>
                                <input type="text" value={form.tags}
                                    onChange={e => setForm({...form, tags: e.target.value})}
                                    placeholder="e.g. kids, summer, sale"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                            </div>

                            {/* Images */}
                            <ImageUploader 
                                existingImages={form.images}
                                onImagesChange={(images) => setForm({...form, images})}
                            />

                            {/* Submit */}
                            <div className="flex gap-2 pt-4">
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
                    /* Products List */
                    <>
                        {/* Search */}
                        <div className="mb-6">
                            <input type="text" placeholder="Search products..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <p className="text-gray-400">Loading products...</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center">
                                <p className="text-gray-400">No products found</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold text-sm text-charcoal">Product</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-sm text-charcoal">Category</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-sm text-charcoal">Price</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-sm text-charcoal">Stock</th>
                                                    <th className="px-4 py-3 text-center font-semibold text-sm text-charcoal">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredProducts.map(product => (
                                                    <tr key={product.id} className="border-b border-gray-100 hover:bg-cream transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                {product.images?.[0] && (
                                                                    <img src={product.images[0].src || product.images[0]} 
                                                                        alt={product.title} 
                                                                        className="w-10 h-10 object-cover rounded-lg" 
                                                                        onError={(e) => e.target.style.display = 'none'} />
                                                                )}
                                                                <div>
                                                                    <p className="font-semibold text-sm text-charcoal">{product.title}</p>
                                                                    <p className="text-xs text-gray-400">{product.product_type}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">{product.category}</td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-coral">PKR {product.price?.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">
                                                            <span className={product.stock > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                                                {product.stock}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button onClick={() => openEdit(product)}
                                                                    className="px-3 py-1 text-xs bg-coral text-white rounded-lg hover:bg-opacity-90">
                                                                    Edit
                                                                </button>
                                                                <button onClick={() => setDeleteConfirm(product.id)}
                                                                    className="px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-opacity-90">
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

                                {/* Pagination */}
                                <div className="mt-6 flex items-center justify-center gap-2">
                                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                                        className="px-3 py-2 text-sm bg-charcoal text-white rounded-lg disabled:opacity-50">
                                        ← Previous
                                    </button>
                                    <span className="text-sm text-charcoal font-semibold">
                                        Page {page} of {maxPages}
                                    </span>
                                    <button onClick={() => setPage(Math.min(maxPages, page + 1))} disabled={page === maxPages}
                                        className="px-3 py-2 text-sm bg-charcoal text-white rounded-lg disabled:opacity-50">
                                        Next →
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative bg-white rounded-2xl p-6 max-w-sm shadow-2xl">
                        <h3 className="font-display text-lg text-charcoal mb-2">Delete Product?</h3>
                        <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
                        <div className="flex gap-2">
                            <button onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-opacity-90">
                                Delete
                            </button>
                            <button onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 bg-gray-200 text-charcoal text-sm font-semibold rounded-lg hover:bg-gray-300">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}