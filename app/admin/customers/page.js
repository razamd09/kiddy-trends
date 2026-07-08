'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminCustomersPage() {
    const [verified, setVerified] = useState(false)
    const [loading, setLoading] = useState(true)
    const [customers, setCustomers] = useState([])
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const pageSize = 30
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
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

    useEffect(() => {
        if (!verified) return
        loadCustomers()
    }, [verified, page])

    async function loadCustomers(search = query, forcedPage = page) {
        setLoading(true)
        const token = localStorage.getItem('admin_token')
        if (!token) return

        try {
            const params = new URLSearchParams({ page: String(forcedPage) })
            if (search.trim()) params.set('q', search.trim())

            const res = await fetch('/api/admin/customers?' + params.toString(), {
                headers: { 'x-admin-token': token }
            })
            const data = await res.json().catch(() => ({}))

            if (!res.ok) throw new Error(data?.error || 'Failed to load customers')

            setCustomers(data.customers || [])
            setTotal(data.total || 0)
        } catch {
            setCustomers([])
            setTotal(0)
        }
        setLoading(false)
    }

    function logout() {
        localStorage.removeItem('admin_token')
        router.push('/admin')
    }

    function submitSearch(e) {
        e.preventDefault()
        setPage(1)
        loadCustomers(query, 1)
    }

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total])

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
                    <h1 className="font-display text-xl text-charcoal">Customers</h1>
                    <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{total}</span>
                </div>
                <button onClick={logout} className="text-sm text-gray-400 hover:text-coral">Logout →</button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
                <form onSubmit={submitSearch} className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by first name, last name, or phone"
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-coral"
                    />
                    <button type="submit" className="px-4 py-2 rounded-xl bg-charcoal text-white text-sm font-semibold hover:opacity-90">
                        Search
                    </button>
                </form>

                <div className="bg-white rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-6 text-gray-400">Loading customers...</div>
                    ) : customers.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <p className="text-4xl mb-2">👥</p>
                            <p>No customers found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-cream text-gray-500">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold">First Name</th>
                                        <th className="text-left px-4 py-3 font-semibold">Last Name</th>
                                        <th className="text-left px-4 py-3 font-semibold">Phone</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map((c) => (
                                        <tr key={c.id} className="border-t border-gray-100">
                                            <td className="px-4 py-3 font-medium text-charcoal">{c.first_name || '-'}</td>
                                            <td className="px-4 py-3 text-charcoal">{c.last_name || '-'}</td>
                                            <td className="px-4 py-3 text-charcoal font-semibold">{c.phone || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-500">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
