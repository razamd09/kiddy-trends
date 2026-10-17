'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EmployeePortalNav from '@/components/EmployeePortalNav'
import OrdersStatusBarChart from '@/components/OrdersStatusBarChart'

const RANGES = [
    { id: 'weekly', label: 'Weekly Orders' },
    { id: 'monthly', label: 'Monthly Orders' },
]

const STATUS_COLUMNS = [
    { key: 'pending', label: 'Pending', color: 'text-orange-600' },
    { key: 'processing', label: 'Processing', color: 'text-blue-600' },
    { key: 'dispatched', label: 'Dispatched', color: 'text-purple-600' },
    { key: 'delivered', label: 'Delivered', color: 'text-green-600' },
    { key: 'cancelled', label: 'Cancelled', color: 'text-red-500' },
]

function formatRowDate(dateStr, range) {
    const d = new Date(dateStr + 'T00:00:00')
    if (range === 'monthly') return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    const end = new Date(d)
    end.setDate(d.getDate() + 6)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' – ' + end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function chartLabel(range) {
    return (dateStr, full) => {
        const d = new Date(dateStr + 'T00:00:00')
        if (range === 'monthly') return d.toLocaleDateString('en-GB', { month: full ? 'long' : 'short', year: 'numeric' })
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + (full ? ' wk' : '')
    }
}

export default function EmployeeOrdersReportingPage() {
    const [ready, setReady] = useState(false)
    const router = useRouter()

    const [range, setRange] = useState('weekly')
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [drillDate, setDrillDate] = useState(null)
    const [drillStatus, setDrillStatus] = useState('')
    const [drillOrders, setDrillOrders] = useState([])
    const [drillLoading, setDrillLoading] = useState(false)
    const [drillError, setDrillError] = useState('')

    useEffect(() => {
        const stored = localStorage.getItem('employee')
        if (!stored) { router.push('/admin'); return }
        setReady(true)
    }, [])

    useEffect(() => {
        if (!ready) return
        async function load() {
            setLoading(true)
            setError('')
            try {
                const res = await fetch('/api/admin/orders/reporting?range=' + range, { cache: 'no-store' })
                const data = await res.json()
                if (!data.success) throw new Error(data.error || 'Failed to load orders report')
                setRows(data.rows || [])
            } catch (err) {
                setError(err.message)
            }
            setLoading(false)
        }
        load()
    }, [ready, range])

    async function openDrillDown(dateKey, status) {
        setDrillDate(dateKey)
        setDrillStatus(status)
        setDrillLoading(true)
        setDrillError('')
        setDrillOrders([])
        try {
            const res = await fetch('/api/admin/orders/reporting/orders?range=' + range + '&date=' + encodeURIComponent(dateKey) + '&status=' + status, { cache: 'no-store' })
            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'Failed to load orders')
            setDrillOrders(data.orders || [])
        } catch (err) {
            setDrillError(err.message)
        }
        setDrillLoading(false)
    }

    function closeDrillDown() {
        setDrillDate(null)
        setDrillStatus('')
    }

    if (!ready) {
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
                    <Link href="/employee/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Orders Reporting</h1>
                </div>
                <p className="text-xs text-gray-400">Orders grouped by the week/month they were placed</p>
            </div>
            <EmployeePortalNav />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

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
                        <p className="text-sm text-gray-400 text-center py-8">No orders yet.</p>
                    )}
                    {!loading && !error && rows.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-gray-500 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-3 py-2 font-semibold">Period</th>
                                        {STATUS_COLUMNS.map((c) => (
                                            <th key={c.key} className="text-right px-3 py-2 font-semibold">{c.label}</th>
                                        ))}
                                        <th className="text-right px-3 py-2 font-semibold">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.date} className="border-b border-gray-50">
                                            <td className="px-3 py-2 text-charcoal whitespace-nowrap">{formatRowDate(r.date, range)}</td>
                                            {STATUS_COLUMNS.map((c) => (
                                                <td key={c.key} className="px-3 py-2 text-right">
                                                    {r[c.key] > 0 ? (
                                                        <button onClick={() => openDrillDown(r.date, c.key)} className={c.color + ' hover:underline font-semibold'}>
                                                            {r[c.key]}
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-300">0</span>
                                                    )}
                                                </td>
                                            ))}
                                            <td className="px-3 py-2 text-right font-semibold text-charcoal">{r.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {!loading && !error && rows.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <p className="font-display text-lg text-charcoal mb-1">Orders by status</p>
                        <p className="text-xs text-gray-500 mb-4">Most recent {Math.min(rows.length, 12)} {range === 'weekly' ? 'weeks' : 'months'} — hover a segment for the exact count.</p>
                        <OrdersStatusBarChart rows={rows} formatLabel={chartLabel(range)} />
                    </div>
                )}
            </div>

            {drillDate && (
                <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={closeDrillDown} />
            )}
            <div className={'fixed top-0 right-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ' + (drillDate ? 'translate-x-0' : 'translate-x-full')}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <p className="font-display text-lg text-charcoal">
                            {STATUS_COLUMNS.find((c) => c.key === drillStatus)?.label || ''}
                        </p>
                        <p className="text-xs text-gray-400">{drillDate ? formatRowDate(drillDate, range) : ''}</p>
                    </div>
                    <button onClick={closeDrillDown} className="text-gray-400 hover:text-coral text-xl leading-none">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {drillLoading && <p className="text-sm text-gray-400">Loading...</p>}
                    {drillError && <p className="text-sm text-red-500">{drillError}</p>}
                    {!drillLoading && !drillError && drillOrders.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-8">No orders found.</p>
                    )}
                    {!drillLoading && !drillError && drillOrders.length > 0 && (
                        <div className="space-y-2">
                            {drillOrders.map((o) => (
                                <div key={o.id} className="border border-gray-100 rounded-xl p-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-semibold text-charcoal">{o.orderNumber}</span>
                                        <span className="font-semibold text-coral">PKR {o.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                        <span>{o.customerName}</span>
                                        <span>{o.city}</span>
                                    </div>
                                    {drillStatus === 'cancelled' && o.cancellationReason && (
                                        <p className="text-xs text-red-500 mt-2">
                                            <span className="font-semibold">Reason:</span> {o.cancellationReason}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
