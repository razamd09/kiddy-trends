'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPakistanDate } from '../../../lib/dateFormat'
import AdminPortalNav from '@/components/AdminPortalNav'

const emptyForm = { id: null, title: '', slug: '', excerpt: '', content: '', cover_image: '', is_published: false }

export default function AdminBlog() {
    const [posts, setPosts]     = useState([])
    const [loading, setLoading] = useState(true)
    const [verified, setVerified] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm]       = useState(emptyForm)
    const [saving, setSaving]   = useState(false)
    const [error, setError]     = useState('')
    const router = useRouter()

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
                    fetchPosts()
                }
            } catch { router.push('/admin') }
        }
        verify()
    }, [])

    async function fetchPosts() {
        setLoading(true)
        const token = localStorage.getItem('admin_token')
        try {
            const res  = await fetch('/api/admin/blog', { headers: { 'x-admin-token': token } })
            const data = await res.json()
            setPosts(data.posts || [])
        } catch {}
        setLoading(false)
    }

    function openNew() {
        setForm(emptyForm)
        setError('')
        setShowForm(true)
    }

    function openEdit(post) {
        setForm({
            id: post.id,
            title: post.title || '',
            slug: post.slug || '',
            excerpt: post.excerpt || '',
            content: post.content || '',
            cover_image: post.cover_image || '',
            is_published: post.is_published,
        })
        setError('')
        setShowForm(true)
    }

    async function handleSave(e) {
        e.preventDefault()
        if (saving) return
        if (!form.title.trim() || !form.content.trim()) {
            setError('Title and content are required')
            return
        }
        setSaving(true)
        setError('')
        const token = localStorage.getItem('admin_token')
        try {
            const res = await fetch('/api/admin/blog', {
                method: form.id ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save')
            setShowForm(false)
            fetchPosts()
        } catch (err) {
            setError(err.message || 'Failed to save')
        }
        setSaving(false)
    }

    async function togglePublish(post) {
        const token = localStorage.getItem('admin_token')
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, is_published: !p.is_published } : p)))
        try {
            await fetch('/api/admin/blog', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                body: JSON.stringify({ id: post.id, is_published: !post.is_published }),
            })
        } catch {}
    }

    async function deletePost(id) {
        if (!confirm('Delete this post permanently?')) return
        const token = localStorage.getItem('admin_token')
        setPosts((prev) => prev.filter((p) => p.id !== id))
        try {
            await fetch('/api/admin/blog?id=' + encodeURIComponent(id), {
                method: 'DELETE',
                headers: { 'x-admin-token': token },
            })
        } catch {}
    }

    function logout() {
        localStorage.removeItem('admin_token')
        router.push('/admin')
    }

    if (!verified) return (
        <div className="min-h-screen bg-cream flex items-center justify-center">
            <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Blog</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={openNew} className="text-sm bg-coral text-white px-4 py-2 rounded-full font-bold hover:bg-opacity-90">
                        + New Post
                    </button>
                    <button onClick={logout} className="text-sm text-gray-400 hover:text-coral">Logout →</button>
                </div>
            </div>
            <AdminPortalNav />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
                        <p className="text-4xl mb-2">✍️</p>
                        <p>No posts yet — write your first one!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {posts.map((post) => (
                            <div key={post.id} className="bg-white rounded-2xl p-5 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-display text-base text-charcoal truncate">{post.title}</p>
                                        <span className={'text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ' + (post.is_published ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500')}>
                                            {post.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">/blog/{post.slug} · {formatPakistanDate(post.created_at)}</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={() => togglePublish(post)}
                                        className="text-xs bg-gray-100 text-charcoal px-3 py-1.5 rounded-full font-bold hover:bg-gray-200">
                                        {post.is_published ? 'Unpublish' : 'Publish'}
                                    </button>
                                    <button onClick={() => openEdit(post)}
                                        className="text-xs bg-skyblue/30 text-charcoal px-3 py-1.5 rounded-full font-bold hover:bg-skyblue/50">
                                        Edit
                                    </button>
                                    <button onClick={() => deletePost(post.id)}
                                        className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-full font-bold hover:bg-red-100">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                            <h2 className="font-display text-xl text-charcoal">{form.id ? 'Edit Post' : 'New Post'}</h2>
                            <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-coral hover:text-white transition-colors flex items-center justify-center">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Title</label>
                                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                    className="mt-1 w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-coral" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500">URL slug (leave blank to auto-generate from title)</label>
                                <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                                    placeholder="auto-generated-from-title"
                                    className="mt-1 w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-coral" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Cover image URL (optional)</label>
                                <input type="text" value={form.cover_image} onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))}
                                    className="mt-1 w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-coral" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Excerpt (short summary shown on the blog list)</label>
                                <textarea value={form.excerpt} rows={2} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                                    className="mt-1 w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-coral resize-none" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Content (HTML supported)</label>
                                <textarea value={form.content} rows={12} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                                    className="mt-1 w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-coral font-mono" />
                            </div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-charcoal">
                                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} />
                                Published (visible on the site)
                            </label>
                            {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
                            <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
                                {saving ? 'Saving…' : 'Save Post'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
