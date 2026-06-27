'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EmployeeProductsPage() {
    const [employee, setEmployee] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState(null)
    const [search, setSearch] = useState('')
    const router = useRouter()

    useEffect(() => {
        const stored = localStorage.getItem('employee')
        if (!stored) { router.push('/employee'); return }
        const emp = JSON.parse(stored)
        const canAccess = emp?.permissions?.can_manage_products !== false
        if (!canAccess) { router.push('/employee/dashboard'); return }
        setEmployee(emp)
        fetchProducts()
    }, [])

    async function fetchProducts() {
        setLoading(true)
        const res = await fetch('/api/employee/products?page=1', { cache: 'no-store' })
        const data = await res.json()
        setProducts(data.products || [])
        setLoading(false)
    }

    function updateLocal(id, field, value) {
        setProducts((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p))
    }

    async function saveProduct(product) {
        setSavingId(product.id)
        await fetch('/api/employee/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: product.id,
                stock: product.stock,
                price: product.price,
                compare_price: product.compare_price,
                is_active: product.is_active,
            }),
        })
        setSavingId(null)
    }

    const filtered = products.filter((p) => (p.title || '').toLowerCase().includes(search.toLowerCase()))

    if (!employee) return null

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/employee/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Manage Products</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full mb-4 px-4 py-3 rounded-xl border-2 border-gray-100"
                />

                {loading ? (
                    <div className="text-gray-400">Loading products...</div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-gray-400">No products found</div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((p) => (
                            <div key={p.id} className="bg-white rounded-2xl p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-display text-charcoal">{p.title}</p>
                                        <p className="text-xs text-gray-400">{p.category} · {p.product_type}</p>
                                    </div>
                                    <label className="text-xs font-semibold text-charcoal flex items-center gap-2">
                                        Active
                                        <input
                                            type="checkbox"
                                            checked={!!p.is_active}
                                            onChange={(e) => updateLocal(p.id, 'is_active', e.target.checked)}
                                        />
                                    </label>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input type="number" value={p.price || 0} onChange={(e) => updateLocal(p.id, 'price', e.target.value)} className="px-3 py-2 rounded-xl border-2 border-gray-100 text-sm" placeholder="Price" />
                                    <input type="number" value={p.compare_price || 0} onChange={(e) => updateLocal(p.id, 'compare_price', e.target.value)} className="px-3 py-2 rounded-xl border-2 border-gray-100 text-sm" placeholder="Compare Price" />
                                    <input type="number" value={p.stock || 0} onChange={(e) => updateLocal(p.id, 'stock', e.target.value)} className="px-3 py-2 rounded-xl border-2 border-gray-100 text-sm" placeholder="Stock" />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => saveProduct(p)}
                                        disabled={savingId === p.id}
                                        className="px-4 py-2 bg-coral text-white text-sm rounded-xl hover:bg-opacity-90 disabled:opacity-50"
                                    >
                                        {savingId === p.id ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
