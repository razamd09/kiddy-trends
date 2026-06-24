'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading]   = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing]   = useState(null)
    const [form, setForm]         = useState({
        title: '', description: '', price: '', compare_price: '',
        category: '', product_type: '', stock: '', images: '', tags: ''
    })
    const [saving, setSaving] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('admin_token')
        if (!token) { router.push('/admin'); return }
        fetchProducts()
    }, [])

    async function fetchProducts() {
        const token = localStorage.getItem('admin_token')
        const res   = await fetch('/api/admin/products', { headers: { 'x-admin-token': token } })
        const data  = await res.json()
        setProducts(data.products || [])
        setLoading(false)
    }

    async function handleSave() {
        setSaving(true)
        const token = localStorage.getItem('admin_token')
        const body  = {
            ...form,
            price:         parseFloat(form.price),
            compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
            stock:         parseInt(form.stock) || 0,
            images:        form.images ? form.images.split('\n').map(s => s.trim()).filter(Boolean) : [],
            tags:          form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
        }

        if (editing) {
            await fetch('/api/admin/products', {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                body:    JSON.stringify({ id: editing.id, ...body })
            })
        } else {
            await fetch('/api/admin/products', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                body:    JSON.stringify(body)
            })
        }

        setSaving(false)
        setShowForm(false)
        setEditing(null)
        setForm({ title: '', description: '', price: '', compare_price: '', category: '', product_type: '', stock: '', images: '', tags: '' })
        fetchProducts()
    }

    async function handleDelete(id) {
        if (!confirm('Delete this product?')) return
        const token = localStorage.getItem('admin_token')
        await fetch('/api/admin/products?id=' + id, {
            method:  'DELETE',
            headers: { 'x-admin-token': token }
        })
        fetchProducts()
    }

    function handleEdit(product) {
        setEditing(product)
        setForm({
            title:         product.title || '',
            description:   product.description || '',
            price:         product.price || '',
            compare_price: product.compare_price || '',
            category:      product.category || '',
            product_type:  product.product_type || '',
            stock:         product.stock || '',
            images:        (product.images || []).join('\n'),
            tags:          (product.tags || []).join(', '),
        })
        setShowForm(true)
    }

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-coral">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Products</h1>
                    <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{products.length}</span>
                </div>
                <button onClick={() => { setShowForm(true); setEditing(null) }}
                        className="bg-coral text-white font-display text-sm px-5 py-2 rounded-full hover:bg-opacity-90">
                    + Add Product
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Add/Edit Form */}
                {showForm && (
                    <div className="bg-white rounded-2xl p-6 mb-6">
                        <h3 className="font-display text-lg text-charcoal mb-4">
                            {editing ? 'Edit Product' : 'Add New Product'}
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-charcoal mb-1">Title *</label>
                                <input type="text" placeholder="Product title" value={form.title}
                                       onChange={e => setForm({...form, title: e.target.value})}
                                       className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-1">Price (PKR) *</label>
                                <input type="number" placeholder="1999" value={form.price}
                                       onChange={e => setForm({...form, price: e.target.value})}
                                       className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-1">Compare Price (PKR)</label>
                                <input type="number" placeholder="2999" value={form.compare_price}
                                       onChange={e => setForm({...form, compare_price: e.target.value})}
                                       className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-1">Category</label>
                                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm">
                                    <option value="">Select category</option>
                                    <option value="clothing">Kids Clothing</option>
                                    <option value="bedding">Kids Bedding</option>
                                    <option value="bags">Bags</option>
                                    <option value="accessories">Accessories</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-1">Stock</label>
                                <input type="number" placeholder="10" value={form.stock}
                                       onChange={e => setForm({...form, stock: e.target.value})}
                                       className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-1">Tags (comma separated)</label>
                                <input type="text" placeholder="boy, summer, 4-5 year" value={form.tags}
                                       onChange={e => setForm({...form, tags: e.target.value})}
                                       className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-charcoal mb-1">Image URLs (one per line)</label>
                                <textarea placeholder="https://cdn.shopify.com/..." value={form.images}
                                          onChange={e => setForm({...form, images: e.target.value})} rows={3}
                                          className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm resize-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-charcoal mb-1">Description</label>
                                <textarea placeholder="Product description..." value={form.description}
                                          onChange={e => setForm({...form, description: e.target.value})} rows={3}
                                          className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={handleSave} disabled={saving || !form.title || !form.price}
                                    className="flex-1 bg-coral text-white font-display py-3 rounded-2xl hover:bg-opacity-90 disabled:opacity-50">
                                {saving ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
                            </button>
                            <button onClick={() => { setShowForm(false); setEditing(null) }}
                                    className="px-6 py-3 border-2 border-gray-200 rounded-2xl text-charcoal hover:border-coral transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Products grid */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <p className="text-4xl mb-2">📦</p>
                        <p className="mb-4">No products yet</p>
                        <button onClick={() => setShowForm(true)} className="btn-primary">Add First Product</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map(product => (
                            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                <div className="aspect-square bg-cream flex items-center justify-center overflow-hidden">
                                    {product.images?.[0] ? (
                                        <img src={product.images[0]} alt={product.title}
                                             className="w-full h-full object-contain mix-blend-multiply p-2" />
                                    ) : (
                                        <span className="text-4xl">👕</span>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="font-display text-sm text-charcoal line-clamp-2 mb-1">{product.title}</p>
                                    <p className="text-coral font-bold text-sm">PKR {product.price?.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Stock: {product.stock}</p>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => handleEdit(product)}
                                                className="flex-1 text-xs py-1.5 bg-skyblue/20 text-charcoal rounded-xl hover:bg-skyblue/40 transition-colors">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(product.id)}
                                                className="flex-1 text-xs py-1.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}