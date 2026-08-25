'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProductMetadataManager({ title, subtitle, apiPath, responseKey, singularLabel }) {
    const [verified, setVerified] = useState(false)
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState([])
    const [editing, setEditing] = useState(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [form, setForm] = useState({ name: '', sort_order: '', is_active: true })
    const router = useRouter()

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
            try {
                const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await res.json()
                if (!data.valid) {
                    localStorage.removeItem('admin_token')
                    router.push('/admin')
                    return
                }
                setVerified(true)
                fetchItems(token)
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

    async function fetchItems(token = localStorage.getItem('admin_token')) {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(apiPath, { headers: { 'x-admin-token': token || '' } })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Failed to load ' + title.toLowerCase())
                setItems([])
                return
            }
            setItems(Array.isArray(data?.[responseKey]) ? data[responseKey] : [])
        } catch (err) {
            setError(err.message || 'Failed to load ' + title.toLowerCase())
            setItems([])
        } finally {
            setLoading(false)
        }
    }

    function resetForm() {
        setEditing(null)
        setForm({ name: '', sort_order: '', is_active: true })
    }

    function handleEdit(item) {
        setEditing(item)
        setForm({
            name: item.name || '',
            sort_order: String(item.sort_order ?? ''),
            is_active: item.is_active !== false,
        })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setSuccess('')

        const name = form.name.trim()
        if (!name) {
            setError(singularLabel + ' name is required')
            return
        }

        const token = localStorage.getItem('admin_token')
        const method = editing ? 'PUT' : 'POST'

        try {
            const res = await fetch(apiPath, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token || '',
                },
                body: JSON.stringify({
                    ...(editing ? { id: editing.id } : {}),
                    name,
                    sort_order: form.sort_order,
                    is_active: form.is_active,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Failed to save ' + singularLabel.toLowerCase())
                return
            }

            setSuccess(editing ? singularLabel + ' updated successfully!' : singularLabel + ' added successfully!')
            resetForm()
            fetchItems(token)
        } catch (err) {
            setError(err.message || 'Failed to save ' + singularLabel.toLowerCase())
        }
    }

    async function handleDelete(item) {
        if (!window.confirm('Delete "' + item.name + '" from active ' + title.toLowerCase() + '?')) return

        const token = localStorage.getItem('admin_token')
        setError('')
        setSuccess('')

        try {
            const res = await fetch(apiPath + '?id=' + encodeURIComponent(item.id), {
                method: 'DELETE',
                headers: { 'x-admin-token': token || '' },
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Failed to delete ' + singularLabel.toLowerCase())
                return
            }

            setSuccess(singularLabel + ' deleted successfully!')
            if (editing?.id === item.id) resetForm()
            fetchItems(token)
        } catch (err) {
            setError(err.message || 'Failed to delete ' + singularLabel.toLowerCase())
        }
    }

    function logout() {
        localStorage.removeItem('admin_token')
        router.push('/admin')
    }

    if (!verified) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-coral rounded-2xl flex items-center justify-center text-white font-display text-lg">M</div>
                    <div>
                        <p className="font-display text-lg text-charcoal">{title}</p>
                        <p className="text-xs text-gray-400">{subtitle}</p>
                    </div>
                </div>
                <button onClick={logout} className="text-sm text-gray-400 hover:text-coral transition-colors">
                    Logout
                </button>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
                    <div className="bg-white rounded-3xl shadow-sm p-6 h-fit">
                        <h2 className="font-display text-2xl text-charcoal mb-2">
                            {editing ? 'Edit ' + singularLabel : 'Add ' + singularLabel}
                        </h2>
                        <p className="text-sm text-gray-500 mb-5">These values appear in product dropdowns and reports.</p>

                        {error && <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-4 text-red-600 text-sm">{error}</div>}
                        {success && <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-4 text-green-600 text-sm">{success}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-semibold text-xs text-charcoal mb-1">Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm"
                                    placeholder={singularLabel + ' name'}
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-xs text-charcoal mb-1">Sort Order</label>
                                <input
                                    type="number"
                                    value={form.sort_order}
                                    onChange={e => setForm({ ...form, sort_order: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm"
                                    placeholder="0"
                                />
                            </div>

                            <label className="flex items-center gap-3 bg-cream p-3 rounded-2xl border-2 border-gray-100">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                    className="w-5 h-5 cursor-pointer accent-coral"
                                />
                                <span className="text-sm text-charcoal font-medium">Active in product dropdowns</span>
                            </label>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="submit"
                                    className="px-5 py-3 bg-coral text-white font-display text-sm rounded-2xl hover:bg-opacity-90"
                                >
                                    {editing ? 'Update ' + singularLabel : 'Add ' + singularLabel}
                                </button>
                                {editing && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-5 py-3 bg-gray-200 text-charcoal font-display text-sm rounded-2xl hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="font-display text-2xl text-charcoal">Current {title}</h2>
                                <p className="text-sm text-gray-500">{items.length} active item(s)</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => fetchItems()}
                                className="px-4 py-2 bg-cream text-charcoal text-sm font-semibold rounded-xl hover:bg-coral/10 hover:text-coral"
                            >
                                Refresh
                            </button>
                        </div>

                        {loading ? (
                            <div className="p-10 text-center text-gray-400">Loading...</div>
                        ) : items.length === 0 ? (
                            <div className="p-10 text-center text-gray-400">No active {title.toLowerCase()} yet.</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {items.map(item => (
                                    <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-charcoal">{item.name}</p>
                                            <p className="text-xs text-gray-400">Sort order: {item.sort_order ?? 0}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(item)}
                                                className="px-4 py-2 bg-charcoal text-white text-sm font-semibold rounded-xl hover:bg-opacity-90"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item)}
                                                className="px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}