'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MonthlyAttendanceSummary, { computeMonthlySummary } from '../../../components/MonthlyAttendanceSummary'

function pad(n) { return String(n).padStart(2, '0') }
function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) }

// The 7 days (Sunday → Saturday) of the week containing the given YYYY-MM-DD date.
// Matches the weekly window used by /api/admin/attendance.
function getWeekDays(dateStr) {
    const base  = new Date(dateStr + 'T00:00:00')
    const start = new Date(base)
    start.setDate(base.getDate() - base.getDay())
    const days = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        days.push(d)
    }
    return days
}

export default function AdminAttendance() {
    const [attendance, setAttendance]   = useState([])
    const [employees, setEmployees]     = useState([])
    const [loading, setLoading]         = useState(true)
    const [verified, setVerified]       = useState(false)
    const [period, setPeriod]           = useState('weekly')
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

    function shiftWeek(deltaDays) {
        const d = new Date(date + 'T00:00:00')
        d.setDate(d.getDate() + deltaDays)
        setDate(ymd(d))
    }

    function logout() {
        localStorage.removeItem('admin_token')
        router.push('/admin')
    }

    // Build the employee-based roster: every employee (even absent ones), plus any
    // employee_id that appears in attendance but isn't in the employees list.
    const empNameMap = new Map()
    employees.forEach(e => empNameMap.set(e.employee_id, e.name))
    attendance.forEach(a => { if (!empNameMap.has(a.employee_id)) empNameMap.set(a.employee_id, a.employee_name) })
    let roster = [...empNameMap.entries()].map(([id, name]) => ({ id, name: name || id }))
    if (selectedEmp !== 'all') roster = roster.filter(r => r.id === selectedEmp)
    roster.sort((a, b) => String(a.name).localeCompare(String(b.name)))

    // Index attendance by employee then date for quick cell lookup.
    const byEmpDate = {}
    attendance.forEach(a => {
        if (!byEmpDate[a.employee_id]) byEmpDate[a.employee_id] = {}
        byEmpDate[a.employee_id][a.date] = a
    })

    const weekDays  = getWeekDays(date)
    const weekLabel = weekDays[0].toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) +
        ' – ' + weekDays[6].toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })

    const totalHours     = attendance.reduce((s, a) => s + (a.duration_minutes || 0), 0)
    const presentCount   = attendance.filter(a => a.time_in).length
    const activeEmployees = roster.filter(r => byEmpDate[r.id]).length

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
                    {period === 'weekly' && (
                        <div className="flex items-center gap-2">
                            <button onClick={() => shiftWeek(-7)}
                                    className="px-3 py-2 rounded-full bg-cream text-charcoal text-sm font-semibold hover:bg-coral/10">← Prev</button>
                            <span className="text-sm font-semibold text-charcoal whitespace-nowrap">{weekLabel}</span>
                            <button onClick={() => shiftWeek(7)}
                                    className="px-3 py-2 rounded-full bg-cream text-charcoal text-sm font-semibold hover:bg-coral/10">Next →</button>
                        </div>
                    )}
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
                        { label: 'Employees',    value: roster.length,             icon: '👥', color: 'bg-skyblue/20' },
                        { label: 'Present',      value: activeEmployees,           icon: '✅', color: 'bg-green-50' },
                        { label: 'Check-ins',    value: presentCount,              icon: '📋', color: 'bg-mint/20' },
                        { label: 'Total Hours',  value: formatDuration(totalHours), icon: '⏱️', color: 'bg-sunny/20' },
                    ].map((stat, i) => (
                        <div key={i} className={'rounded-2xl p-4 ' + stat.color}>
                            <p className="text-2xl mb-1">{stat.icon}</p>
                            <p className="font-display text-2xl text-charcoal">{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
                        <p className="animate-pulse">Loading attendance...</p>
                    </div>
                ) : period === 'weekly' ? (
                    /* Employee-based weekly grid */
                    <div className="bg-white rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <p className="font-display text-lg text-charcoal">
                                Weekly Attendance
                                <span className="text-sm font-body text-gray-400 ml-2">{weekLabel}</span>
                            </p>
                            <button onClick={fetchAttendance} className="text-xs text-gray-400 hover:text-coral">🔄 Refresh</button>
                        </div>

                        {roster.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <p className="text-4xl mb-2">👥</p>
                                <p>No employees found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-cream">
                                    <tr>
                                        <th className="text-left p-3 font-semibold text-charcoal sticky left-0 bg-cream z-10">Employee</th>
                                        {weekDays.map((d, i) => (
                                            <th key={i} className="p-3 font-semibold text-charcoal text-center whitespace-nowrap">
                                                {d.toLocaleDateString('en-PK', { weekday: 'short' })}
                                                <span className="block text-xs font-body text-gray-400">
                                                    {d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </th>
                                        ))}
                                        <th className="p-3 font-semibold text-charcoal text-center whitespace-nowrap">Total</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {roster.map((emp, ri) => {
                                        const days = weekDays.map(d => byEmpDate[emp.id]?.[ymd(d)] || null)
                                        const presentDays = days.filter(r => r && r.time_in).length
                                        const empMinutes  = days.reduce((s, r) => s + (r?.duration_minutes || 0), 0)
                                        return (
                                            <tr key={emp.id} className={ri % 2 === 0 ? 'bg-white' : 'bg-cream/40'}>
                                                <td className="p-3 sticky left-0 z-10 whitespace-nowrap"
                                                    style={{ background: ri % 2 === 0 ? '#ffffff' : 'rgba(245,242,235,0.4)' }}>
                                                    <p className="font-semibold text-charcoal">{emp.name}</p>
                                                    <p className="text-xs text-gray-400">{emp.id}</p>
                                                </td>
                                                {days.map((rec, di) => (
                                                    <td key={di} className="p-3 text-center">
                                                        {rec && rec.time_in ? (
                                                            rec.time_out ? (
                                                                <div title={
                                                                    'In: ' + new Date(rec.time_in).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) +
                                                                    ' · Out: ' + new Date(rec.time_out).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
                                                                }>
                                                                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-bold">✓</span>
                                                                    <span className="block text-xs text-gray-500 mt-1">{formatDuration(rec.duration_minutes)}</span>
                                                                </div>
                                                            ) : (
                                                                <div title={'In: ' + new Date(rec.time_in).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}>
                                                                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-500 font-bold">⏳</span>
                                                                    <span className="block text-xs text-gray-400 mt-1">Active</span>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-300">—</span>
                                                        )}
                                                    </td>
                                                ))}
                                                <td className="p-3 text-center whitespace-nowrap">
                                                    <p className="font-bold text-coral">{presentDays}/7</p>
                                                    <p className="text-xs text-gray-400">{formatDuration(empMinutes)}</p>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : period === 'monthly' ? (
                    /* Employee-based monthly summary */
                    selectedEmp !== 'all' ? (
                        <div className="bg-white rounded-2xl p-6">
                            <MonthlyAttendanceSummary records={attendance} monthDate={new Date(date + 'T00:00:00')} />
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <p className="font-display text-lg text-charcoal">
                                    Monthly Summary
                                    <span className="text-sm font-body text-gray-400 ml-2">
                                        {new Date(date + 'T00:00:00').toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
                                    </span>
                                </p>
                                <button onClick={fetchAttendance} className="text-xs text-gray-400 hover:text-coral">🔄 Refresh</button>
                            </div>
                            {roster.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    <p className="text-4xl mb-2">👥</p>
                                    <p>No employees found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-cream">
                                        <tr>
                                            <th className="text-left p-4 font-semibold text-charcoal">Employee</th>
                                            <th className="p-4 font-semibold text-charcoal text-center">Present</th>
                                            <th className="p-4 font-semibold text-charcoal text-center">Absent</th>
                                            <th className="p-4 font-semibold text-charcoal text-center">Too Early</th>
                                            <th className="p-4 font-semibold text-charcoal text-center">Avg Hrs/Day</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {roster.map((emp, ri) => {
                                            const empRecords = attendance.filter(a => a.employee_id === emp.id)
                                            const s = computeMonthlySummary(empRecords, new Date(date + 'T00:00:00'))
                                            return (
                                                <tr key={emp.id} className={ri % 2 === 0 ? 'bg-white' : 'bg-cream/50'}>
                                                    <td className="p-4">
                                                        <p className="font-semibold text-charcoal">{emp.name}</p>
                                                        <p className="text-xs text-gray-400">{emp.id}</p>
                                                    </td>
                                                    <td className="p-4 text-center font-bold text-green-600">{s.present}</td>
                                                    <td className="p-4 text-center font-bold text-red-500">{s.absent}</td>
                                                    <td className="p-4 text-center font-bold text-orange-500">{s.tooEarly}</td>
                                                    <td className="p-4 text-center font-bold text-coral">{formatDuration(s.avgMinutes)}</td>
                                                </tr>
                                            )
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    /* Flat record table for daily / yearly */
                    <div className="bg-white rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <p className="font-display text-lg text-charcoal">
                                Attendance Records
                                <span className="text-sm font-body text-gray-400 ml-2">({attendance.length} records)</span>
                            </p>
                            <button onClick={fetchAttendance} className="text-xs text-gray-400 hover:text-coral">🔄 Refresh</button>
                        </div>

                        {attendance.length === 0 ? (
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
                                    {[...attendance]
                                        .sort((a, b) => String(a.employee_name).localeCompare(String(b.employee_name)) || String(b.date).localeCompare(String(a.date)))
                                        .map((record, i) => (
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
                )}
            </div>
        </div>
    )
}
