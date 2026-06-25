'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminCollections() {
    const [collections, setCollections] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    
    const [form, setForm] = useState({
        name: '',
        keywords: '',
        description: ''
    })

    useEffect(() => {
        fetchCollections()
    }, [])

    async function fetchCollections() {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/collections')
            const data = await res.json()
            setCollections(data.collections || [])
        } catch (err) {
            alert('Error loading collections: ' + err.message)
        }
        setLoading(false)
    }

    function resetForm() {
        setForm({ name: '', keywords: '', description: '' })
        setEditingId(null)
    }

    function openEdit(collection) {
        setForm({
            name: collection.name,
            keywords: (collection.keywords || []).join(', '),
            description: collection.description || ''
        })
        setEditingId(collection.id)
        setShowForm(true)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)

        try {
            const payload = {
                name: form.name,
                keywords: form.keywords.split(',').map(k => k.trim()).filter(k => k),
                description: form.description
            }

            if (editingId) {
                payload.id = editingId
                const res = await fetch('/api/admin/collections', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                const data = await res.json()
                if (data.success) {
                    alert('Collection updated!')
                    setShowForm(false)
                    resetForm()
                    fetchCollections()
                } else {
                    alert('Error: ' + data.error)
                }
            } else {
                const res = await fetch('/api/admin/collections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                const data = await res.json()
                if (data.success) {
                    alert('Collection added!')
                    setShowForm(false)
                    resetForm()
                    fetchCollections()
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
            const res = await fetch(`/api/admin/collections?id=${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                alert('Collection deleted!')
                setDeleteConfirm(null)
                fetchCollections()
            } else {
                alert('Error: ' + data.error)
            }
        } catch (err) {
            alert('Error: ' + err.message)
        }
    }

    return (
        <div className="min-h-screen bg-cream">
            {/* Header */}
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl text-charcoal">Collections</h1>
                    <p className="text-xs text-gray-400">Manage product categories</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { resetForm(); setShowForm(!showForm) }}
                        className="px-5 py-2 bg-coral text-white font-display text-sm rounded-full hover:bg-opacity-90">
                        {showForm ? '← Back' : '+ Add Collection'}
                    </button>
                    <Link href="/admin/dashboard"
                        className="px-5 py-2 bg-charcoal text-white font-display text-sm rounded-full hover:opacity-90">
                        ← Dashboard
                    </Link>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {showForm ? (
                    /* Add/Edit Form */
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <h2 className="font-display text-xl text-charcoal mb-6">
                            {editingId ? 'Edit Collection' : 'Add New Collection'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block font-semibold text-sm text-charcoal mb-1">Collection Name *</label>
                                <input type="text" required value={form.name}
                                    onChange={e => setForm({...form, name: e.target.value})}
                                    placeholder="e.g. Boys, Girls, Infant, Toddler"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                            </div>

                            {/* Keywords */}
                            <div>
                                <label className="block font-semibold text-sm text-charcoal mb-1">Keywords (comma-separated) *</label>
                                <input type="text" required value={form.keywords}
                                    onChange={e => setForm({...form, keywords: e.target.value})}
                                    placeholder="e.g. boy, boys, male, sons, brothers"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm" />
                                <p className="text-xs text-gray-400 mt-1">Products with titles containing these keywords will auto-match this collection</p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block font-semibold text-sm text-charcoal mb-1">Description</label>
                                <textarea value={form.description}
                                    onChange={e => setForm({...form, description: e.target.value})}
                                    placeholder="Collection description..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm resize-none" />
                            </div>

                            {/* Submit */}
                            <div className="flex gap-2 pt-4">
                                <button type="submit" disabled={submitting}
                                    className="flex-1 px-5 py-3 bg-coral text-white font-display rounded-xl hover:bg-opacity-90 disabled:opacity-50">
                                    {submitting ? 'Saving...' : editingId ? 'Update Collection' : 'Add Collection'}
                                </button>
                                <button type="button" onClick={() => { setShowForm(false); resetForm() }}
                                    className="px-5 py-3 bg-gray-200 text-charcoal font-display rounded-xl hover:bg-gray-300">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    /* Collections List */
                    <>
                        {loading ? (
                            <div className="text-center py-8">
                                <p className="text-gray-400">Loading collections...</p>
                            </div>
                        ) : collections.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center">
                                <p className="text-gray-400 mb-4">No collections yet</p>
                                <button onClick={() => setShowForm(true)}
                                    className="px-5 py-2 bg-coral text-white font-display text-sm rounded-full">
                                    + Create First Collection
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {collections.map(collection => (
                                    <div key={collection.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="font-display text-lg text-charcoal">{collection.name}</h3>
                                                <p className="text-xs text-gray-400 mt-1">{collection.description}</p>
                                            </div>
                                            <span className="px-3 py-1 bg-mint/20 text-green-600 text-xs font-bold rounded-full">
                                                Active
                                            </span>
                                        </div>

                                        {/* Keywords */}
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold text-charcoal mb-2">Keywords:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {(collection.keywords || []).map((keyword, i) => (
                                                    <span key={i} className="px-2 py-1 bg-cream text-charcoal text-xs rounded-lg">
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-4">
                                            <button onClick={() => openEdit(collection)}
                                                className="flex-1 px-3 py-2 text-xs bg-coral text-white rounded-lg hover:bg-opacity-90">
                                                Edit
                                            </button>
                                            <button onClick={() => setDeleteConfirm(collection.id)}
                                                className="flex-1 px-3 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-opacity-90">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative bg-white rounded-2xl p-6 max-w-sm shadow-2xl">
                        <h3 className="font-display text-lg text-charcoal mb-2">Delete Collection?</h3>
                        <p className="text-sm text-gray-500 mb-6">This action cannot be undone. Products won't be removed.</p>
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
