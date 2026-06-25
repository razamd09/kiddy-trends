'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminAttendance() {
    const [attendance, setAttendance]   = useState([])
    const [employees, setEmployees]     = useState([])
    const [loading, setLoading]         = useState(true)
    const [verified, setVerified]       = useState(false)
    const [period, setPeriod]           = useState('daily')
    const [selectedEmp, setSelectedEmp] = useState('all')
    const [date, setDate]               = useState(new Date().toISOString().split('T')[0])
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
                    fetchEmployees(token)
                    fetchAttendance()
                }
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

    useEffect(() => {
        if (verified) fetchAttendance()
    }, [verified, period, selectedEmp, date])

    async function fetchEmployees(t) {
        const token = t || localStorage.getItem('admin_token')
        const res   = await fetch('/api/admin/employees', { headers: { 'x-admin-token': token } })
        const data  = await res.json()
        setEmployees(data.employees || [])
    }

    async function fetchAttendance() {
        setLoading(true)
        let url = '/api/admin/attendance?period=' + period + '&date=' + date
        if (selectedEmp !== 'all') url += '&employee_id=' + selectedEmp
        const res  = await fetch(url)
        const data = await res.json()
        setAttendance(data.attendance || [])
        setLoading(false)
    }

    function formatDuration(minutes) {
        if (!minutes) return '—'
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return h + 'h ' + m + 'm'
    }

    function logout() {
        localStorage.removeItem('admin_token')
        router.push('/admin')
    }

    const totalHours     = attendance.reduce((s, a) => s + (a.duration_minutes || 0), 0)
    const presentCount   = attendance.filter(a => a.time_in).length
    const completedCount = attendance.filter(a => a.time_out).length

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
                    <h1 className="font-display text-xl text-charcoal">Attendance</h1>
                </div>
                <button onClick={logout} className="text-sm text-gray-400 hover:text-coral">Logout →</button>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Filters */}
                <div className="bg-white rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
                    <div className="flex gap-2 flex-wrap">
                        {['daily','weekly','monthly','yearly'].map(p => (
                            <button key={p} onClick={() => setPeriod(p)}
                                    className={'px-4 py-2 rounded-full text-sm font-semibold transition-all ' +
                                        (period === p ? 'bg-coral text-white' : 'bg-cream text-charcoal hover:bg-coral/10')}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                           className="px-4 py-2 rounded-full border-2 border-gray-100 focus:border-coral focus:outline-none text-sm bg-cream" />
                    <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}
                            className="px-4 py-2 rounded-full border-2 border-gray-100 focus:border-coral focus:outline-none text-sm bg-cream">
                        <option value="all">All Employees</option>
                        {employees.map(emp => (
                            <option key={emp.employee_id} value={emp.employee_id}>{emp.name}</option>
                        ))}
                    </select>
                    <button onClick={fetchAttendance}
                            className="px-4 py-2 bg-coral text-white rounded-full text-sm font-semibold hover:bg-opacity-90">
                        🔍 Search
                    </button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Records', value: attendance.length,        icon: '📋', color: 'bg-skyblue/20' },
                        { label: 'Present',       value: presentCount,             icon: '✅', color: 'bg-green-50' },
                        { label: 'Completed',     value: completedCount,           icon: '🎯', color: 'bg-mint/20' },
                        { label: 'Total Hours',   value: formatDuration(totalHours), icon: '⏱️', color: 'bg-sunny/20' },
                    ].map((stat, i) => (
                        <div key={i} className={'rounded-2xl p-4 ' + stat.color}>
                            <p className="text-2xl mb-1">{stat.icon}</p>
                            <p className="font-display text-2xl text-charcoal">{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Attendance table */}
                <div className="bg-white rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <p className="font-display text-lg text-charcoal">
                            Attendance Records
                            <span className="text-sm font-body text-gray-400 ml-2">({attendance.length} records)</span>
                        </p>
                        <button onClick={fetchAttendance} className="text-xs text-gray-400 hover:text-coral">🔄 Refresh</button>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-400">
                            <p className="animate-pulse">Loading attendance...</p>
                        </div>
                    ) : attendance.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <p className="text-4xl mb-2">📅</p>
                            <p>No attendance records found</p>
                            <p className="text-xs mt-1">Try changing the date or period filter</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-cream">
                                <tr>
                                    <th className="text-left p-4 font-semibold text-charcoal">Employee</th>
                                    <th className="text-left p-4 font-semibold text-charcoal">Date</th>
                                    <th className="text-left p-4 font-semibold text-charcoal">Time In</th>
                                    <th className="text-left p-4 font-semibold text-charcoal">Time Out</th>
                                    <th className="text-left p-4 font-semibold text-charcoal">Duration</th>
                                    <th className="text-left p-4 font-semibold text-charcoal">Status</th>
                                </tr>
                                </thead>
                                <tbody>
                                {attendance.map((record, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-cream/50'}>
                                        <td className="p-4">
                                            <p className="font-semibold text-charcoal">{record.employee_name}</p>
                                            <p className="text-xs text-gray-400">{record.employee_id}</p>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {new Date(record.date).toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="p-4 font-semibold text-coral">
                                            {record.time_in ? new Date(record.time_in).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </td>
                                        <td className="p-4 font-semibold text-charcoal">
                                            {record.time_out ? new Date(record.time_out).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </td>
                                        <td className="p-4 font-bold text-coral">
                                            {formatDuration(record.duration_minutes)}
                                        </td>
                                        <td className="p-4">
                        <span className={'text-xs px-2 py-1 rounded-full font-bold ' +
                            (record.time_out ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500')}>
                          {record.time_out ? '✅ Complete' : '⏳ Active'}
                        </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}