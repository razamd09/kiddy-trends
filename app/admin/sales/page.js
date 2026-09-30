'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPortalNav from '@/components/AdminPortalNav'
import SalesBarChart from '@/components/SalesBarChart'

const RANGES = [
    { id: 'daily', label: 'Daily Sale' },
    { id: 'weekly', label: 'Weekly Sale' },
    { id: 'monthly', label: 'Monthly Sale' },
]

function money(n) {
    return 'PKR ' + Math.round(Number(n) || 0).toLocaleString()
}

function formatRowDate(dateStr, range) {
    const d = new Date(dateStr + 'T00:00:00')
    if (range === 'monthly') return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    if (range === 'weekly') {
        const end = new Date(d)
        end.setDate(d.getDate() + 6)
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' – ' + end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    }
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' })
}

function chartLabel(range) {
    return (dateStr, full) => {
        const d = new Date(dateStr + 'T00:00:00')
        if (range === 'monthly') return d.toLocaleDateString('en-GB', { month: full ? 'long' : 'short', year: 'numeric' })
        if (range === 'weekly') return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + (full ? ' wk' : '')
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    }
}

export default function AdminSalesPage() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()

    const [range, setRange] = useState('daily')
    const [rows, setRows] = useState([])
    const [todayRow, setTodayRow] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
            try {
                const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await res.json()
                if (!data.valid) { localStorage.removeItem('admin_token'); router.push('/admin'); return }
                setVerified(true)
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

    useEffect(() => {
        if (!verified) return
        async function load() {
            setLoading(true)
            setError('')
            try {
                const token = localStorage.getItem('admin_token') || ''
                const res = await fetch('/api/admin/sales?range=' + range, { headers: { 'x-admin-token': token } })
                const data = await res.json()
                if (!data.success) throw new Error(data.error || 'Failed to load sales')
                setRows(data.rows || [])
                setTodayRow(data.todayRow || null)
            } catch (err) {
                setError(err.message)
            }
            setLoading(false)
        }
        load()
    }, [verified, range])

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
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Sale</h1>
                </div>
                <p className="text-xs text-gray-400">Booked Post Ex orders only — cancelled orders excluded</p>
            </div>
            <AdminPortalNav />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {todayRow && (
                    <div className="bg-charcoal rounded-2xl p-6 shadow-sm text-white">
                        <p className="font-display text-lg mb-4">Current Sale — Today</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-white/60">Orders</p>
                                <p className="font-display text-2xl">{todayRow.orders}</p>
                            </div>
                            <div>
                                <p className="text-xs text-white/60">Total Sale</p>
                                <p className="font-display text-2xl">{money(todayRow.totalSale)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-white/60">Shipping Charges</p>
                                <p className="font-display text-2xl">{money(todayRow.shipping)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-white/60">Net Sale</p>
                                <p className="font-display text-2xl text-mint">{money(todayRow.netSale)}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex gap-2 mb-6">
                        {RANGES.map((r) => (
                            <button key={r.id} onClick={() => setRange(r.id)}
                                    className={'px-5 py-2 rounded-full font-display text-sm transition-colors ' + (range === r.id ? 'bg-coral text-white' : 'bg-cream text-charcoal hover:bg-coral/10')}>
                                {r.label}
                            </button>
                        ))}
                    </div>

                    {loading && <p className="text-sm text-gray-400">Loading...</p>}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {!loading && !error && rows.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-8">No booked orders yet.</p>
                    )}
                    {!loading && !error && rows.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-gray-500 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-3 py-2 font-semibold">Date</th>
                                        <th className="text-right px-3 py-2 font-semibold">Number of Orders</th>
                                        <th className="text-right px-3 py-2 font-semibold">Total Sale</th>
                                        <th className="text-right px-3 py-2 font-semibold">Shipping Charges</th>
                                        <th className="text-right px-3 py-2 font-semibold">Net Sale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.date} className="border-b border-gray-50">
                                            <td className="px-3 py-2 text-charcoal whitespace-nowrap">{formatRowDate(r.date, range)}</td>
                                            <td className="px-3 py-2 text-right text-charcoal">{r.orders}</td>
                                            <td className="px-3 py-2 text-right text-charcoal">{money(r.totalSale)}</td>
                                            <td className="px-3 py-2 text-right text-gray-500">{money(r.shipping)}</td>
                                            <td className="px-3 py-2 text-right font-semibold text-mint">{money(r.netSale)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {!loading && !error && rows.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <p className="font-display text-lg text-charcoal mb-1">Net Sale trend</p>
                        <p className="text-xs text-gray-500 mb-4">Most recent {Math.min(rows.length, 12)} {range === 'daily' ? 'days' : range === 'weekly' ? 'weeks' : 'months'} — hover a bar for the exact figure.</p>
                        <SalesBarChart rows={rows} formatLabel={chartLabel(range)} />
                    </div>
                )}
            </div>
        </div>
    )
}
