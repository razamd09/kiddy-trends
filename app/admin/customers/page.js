'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function parseCsv(text) {
    const rows = []
    let current = ''
    let row = []
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        const next = text[i + 1]

        if (ch === '"') {
            if (inQuotes && next === '"') {
                current += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
            continue
        }

        if (ch === ',' && !inQuotes) {
            row.push(current)
            current = ''
            continue
        }

        if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (ch === '\r' && next === '\n') i++
            row.push(current)
            if (row.some((v) => String(v || '').trim() !== '')) rows.push(row)
            row = []
            current = ''
            continue
        }

        current += ch
    }

    if (current.length > 0 || row.length > 0) {
        row.push(current)
        if (row.some((v) => String(v || '').trim() !== '')) rows.push(row)
    }

    return rows
}

function normalizeHeader(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function mapCsvToCustomers(text) {
    const table = parseCsv(text)
    if (!table.length) return []

    const header = table[0].map(normalizeHeader)
    const firstIdx = header.findIndex((h) => h === 'firstname' || h === 'first_name' || h === 'first')
    const lastIdx = header.findIndex((h) => h === 'lastname' || h === 'last_name' || h === 'last')
    const phoneIdx = header.findIndex((h) => h === 'phone' || h === 'phonenumber' || h === 'mobile' || h === 'whatsapp' || h === 'number')

    const hasHeader = firstIdx >= 0 || lastIdx >= 0 || phoneIdx >= 0
    const start = hasHeader ? 1 : 0
    const firstCol = hasHeader ? firstIdx : 0
    const lastCol = hasHeader ? lastIdx : 1
    const phoneCol = hasHeader ? phoneIdx : 2

    const rows = []
    for (let i = start; i < table.length; i++) {
        const r = table[i]
        rows.push({
            first_name: firstCol >= 0 ? String(r[firstCol] || '').trim() : '',
            last_name: lastCol >= 0 ? String(r[lastCol] || '').trim() : '',
            phone: phoneCol >= 0 ? String(r[phoneCol] || '').trim() : '',
        })
    }
    return rows
}

export default function AdminCustomersPage() {
    const [verified, setVerified] = useState(false)
    const [loading, setLoading] = useState(true)
    const [customers, setCustomers] = useState([])
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [statusMessage, setStatusMessage] = useState('')
    const [syncingOrders, setSyncingOrders] = useState(false)
    const [importingCsv, setImportingCsv] = useState(false)
    const [csvName, setCsvName] = useState('')
    const pageSize = 30
    const fileRef = useRef(null)
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

    async function syncFromOrders() {
        const token = localStorage.getItem('admin_token')
        if (!token) return

        setSyncingOrders(true)
        setStatusMessage('')
        try {
            const res = await fetch('/api/admin/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token,
                },
                body: JSON.stringify({ action: 'backfill-orders' }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || 'Failed to sync customers from orders')

            setStatusMessage('Imported ' + (data.imported || 0) + ' customers from orders')
            await loadCustomers(query, 1)
            setPage(1)
        } catch (error) {
            setStatusMessage(error.message || 'Failed to sync customers from orders')
        }
        setSyncingOrders(false)
    }

    function triggerCsvPicker() {
        fileRef.current?.click()
    }

    async function uploadCsv(e) {
        const file = e.target.files?.[0]
        if (!file) return

        const token = localStorage.getItem('admin_token')
        if (!token) return

        setImportingCsv(true)
        setStatusMessage('')
        setCsvName(file.name)

        try {
            const text = await file.text()
            const rows = mapCsvToCustomers(text)
            if (!rows.length) throw new Error('No rows found in CSV')

            const batchSize = 200
            let importedTotal = 0

            for (let i = 0; i < rows.length; i += batchSize) {
                const chunk = rows.slice(i, i + batchSize)
                const res = await fetch('/api/admin/customers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': token,
                    },
                    body: JSON.stringify({ action: 'import-csv', rows: chunk }),
                })
                const data = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error(data?.error || 'CSV import failed')
                importedTotal += Number(data.imported || 0)
            }

            setStatusMessage('CSV import complete. Added/updated ' + importedTotal + ' customers')
            await loadCustomers(query, 1)
            setPage(1)
        } catch (error) {
            setStatusMessage(error.message || 'Failed to import CSV')
        }

        e.target.value = ''
        setImportingCsv(false)
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

                <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div>
                        <p className="font-semibold text-charcoal">Import Customers</p>
                        <p className="text-xs text-gray-400">Sync old orders or upload CSV with first name, last name, phone</p>
                        {csvName && <p className="text-xs text-gray-500 mt-1">Selected file: {csvName}</p>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={syncFromOrders}
                            disabled={syncingOrders || importingCsv}
                            className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50"
                        >
                            {syncingOrders ? 'Syncing...' : 'Sync From Orders'}
                        </button>
                        <button
                            onClick={triggerCsvPicker}
                            disabled={syncingOrders || importingCsv}
                            className="px-4 py-2 rounded-xl bg-coral text-white text-sm font-semibold disabled:opacity-50"
                        >
                            {importingCsv ? 'Uploading...' : 'Upload CSV'}
                        </button>
                        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={uploadCsv} className="hidden" />
                    </div>
                </div>

                {statusMessage && (
                    <div className="bg-white rounded-2xl p-3">
                        <p className={(statusMessage.toLowerCase().includes('failed') || statusMessage.toLowerCase().includes('error')) ? 'text-coral text-sm' : 'text-emerald-600 text-sm'}>
                            {statusMessage}
                        </p>
                    </div>
                )}

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
