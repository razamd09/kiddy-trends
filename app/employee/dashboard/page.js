'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function EmployeeDashboard() {
    const [employee, setEmployee]     = useState(null)
    const [permissions, setPermissions] = useState({
        can_manage_orders: true,
        can_manage_products: true,
        can_manage_rewards: true,
    })
    const [attendance, setAttendance] = useState(null)
    const [loading, setLoading]       = useState(false)
    const [message, setMessage]       = useState('')
    const [time, setTime]             = useState(new Date())
    const [history, setHistory]       = useState([])
    const router = useRouter()
    const displayTimeZone = 'Asia/Karachi'

    useEffect(() => {
        const stored = localStorage.getItem('employee')
        if (!stored) { router.push('/employee'); return }
        const emp = JSON.parse(stored)
        setEmployee(emp)
        setPermissions(emp.permissions || {
            can_manage_orders: true,
            can_manage_products: true,
            can_manage_rewards: true,
        })
        fetchEmployeeProfile(emp.employee_id)
        fetchTodayAttendance(emp.employee_id)
        fetchHistory(emp.employee_id)
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    async function fetchEmployeeProfile(empId) {
        try {
            const res = await fetch('/api/employee/profile?employee_id=' + encodeURIComponent(empId), { cache: 'no-store' })
            const data = await res.json()
            if (data.success && data.employee) {
                setEmployee((prev) => ({ ...prev, ...data.employee }))
                setPermissions(data.employee.permissions || {
                    can_manage_orders: true,
                    can_manage_products: true,
                    can_manage_rewards: true,
                })
                localStorage.setItem('employee', JSON.stringify({
                    ...JSON.parse(localStorage.getItem('employee') || '{}'),
                    ...data.employee,
                }))
            }
        } catch {}
    }

    async function fetchTodayAttendance(empId) {
        const res   = await fetch('/api/admin/attendance?employee_id=' + empId + '&period=daily')
        const data  = await res.json()
        setAttendance(data.attendance?.[0] || null)
    }

    async function fetchHistory(empId) {
        const res   = await fetch('/api/admin/attendance?employee_id=' + empId + '&period=monthly')
        const data  = await res.json()
        setHistory(data.attendance || [])
    }

    function formatPkTime(value) {
        if (!value) return '—'
        return new Date(value).toLocaleTimeString('en-PK', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: displayTimeZone,
        })
    }

    async function handleTimeIn() {
        setLoading(true)
        setMessage('')
        const res  = await fetch('/api/admin/attendance', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ employee_id: employee.employee_id, employee_name: employee.name })
        })
        const data = await res.json()
        if (data.success) {
            setAttendance(data.attendance)
            const stamp = data.server_time ? new Date(data.server_time) : new Date()
            setMessage('✅ Time In recorded at ' + stamp.toLocaleTimeString('en-PK', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: displayTimeZone,
            }))
        } else {
            setMessage('⚠️ ' + data.error)
        }
        setLoading(false)
    }

    async function handleTimeOut() {
        setLoading(true)
        setMessage('')
        const res  = await fetch('/api/admin/attendance', {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ employee_id: employee.employee_id })
        })
        const data = await res.json()
        if (data.success) {
            setAttendance(data.attendance)
            const stamp = data.server_time ? new Date(data.server_time) : new Date()
            setMessage('✅ Time Out recorded at ' + stamp.toLocaleTimeString('en-PK', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: displayTimeZone,
            }))
            fetchHistory(employee.employee_id)
        } else {
            setMessage('⚠️ ' + data.error)
        }
        setLoading(false)
    }

    function formatDuration(minutes) {
        if (!minutes) return '—'
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return h + 'h ' + m + 'm'
    }

    function logout() {
        localStorage.removeItem('employee')
        router.push('/employee')
    }

    if (!employee) return null

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Image src="/logo.jpg" alt="Kiddy Trends" width={40} height={40} className="rounded-xl" />
                    <div>
                        <p className="font-display text-lg text-charcoal">{employee.name}</p>
                        <p className="text-xs text-gray-400">{employee.employee_id} · {employee.role}</p>
                    </div>
                </div>
                <button onClick={logout} className="text-sm text-gray-400 hover:text-coral">Logout →</button>
            </div>

            <div className="max-w-lg mx-auto px-4 py-8 space-y-5">

                {/* Clock */}
                <div className="bg-charcoal rounded-3xl p-6 text-center">
                    <p className="text-gray-400 text-sm mb-1">
                        {time.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="font-display text-5xl text-white">{time.toLocaleTimeString('en-PK')}</p>
                </div>

                {/* Today status */}
                <div className="bg-white rounded-3xl p-5">
                    <p className="font-display text-lg text-charcoal mb-4">Today's Attendance</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-cream rounded-2xl p-4 text-center">
                            <p className="text-xs text-gray-400 mb-1">Time In</p>
                            <p className="font-display text-xl text-coral">
                                {formatPkTime(attendance?.time_in)}
                            </p>
                        </div>
                        <div className="bg-cream rounded-2xl p-4 text-center">
                            <p className="text-xs text-gray-400 mb-1">Time Out</p>
                            <p className="font-display text-xl text-coral">
                                {formatPkTime(attendance?.time_out)}
                            </p>
                        </div>
                    </div>

                    {attendance?.duration_minutes && (
                        <div className="bg-mint/20 rounded-2xl p-3 text-center mb-4">
                            <p className="text-sm text-charcoal">
                                Total Hours Today: <strong className="text-coral">{formatDuration(attendance.duration_minutes)}</strong>
                            </p>
                        </div>
                    )}

                    {message && (
                        <div className="bg-sunny/20 rounded-2xl p-3 text-center mb-4">
                            <p className="text-sm text-charcoal">{message}</p>
                        </div>
                    )}

                    {!attendance ? (
                        <button onClick={handleTimeIn} disabled={loading}
                                className="w-full bg-coral text-white font-display text-lg py-4 rounded-2xl hover:bg-opacity-90 disabled:opacity-70">
                            {loading ? 'Recording...' : '🟢 Time In'}
                        </button>
                    ) : !attendance.time_out ? (
                        <button onClick={handleTimeOut} disabled={loading}
                                className="w-full bg-charcoal text-white font-display text-lg py-4 rounded-2xl hover:bg-opacity-90 disabled:opacity-70">
                            {loading ? 'Recording...' : '🔴 Time Out'}
                        </button>
                    ) : (
                        <div className="bg-green-50 rounded-2xl p-4 text-center">
                            <p className="text-2xl mb-1">✅</p>
                            <p className="font-display text-green-600">Attendance Complete!</p>
                            <p className="text-xs text-gray-400 mt-1">You have clocked in and out today</p>
                        </div>
                    )}
                </div>

                {/* Monthly history */}
                <div className="bg-white rounded-3xl p-5">
                    <p className="font-display text-lg text-charcoal mb-4">This Month's Attendance</p>
                    {history.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-4">No attendance records yet</p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {history.map((record, i) => (
                                <div key={i} className="flex items-center justify-between bg-cream rounded-xl px-4 py-3">
                                    <div>
                                        <p className="font-semibold text-sm text-charcoal">
                                            {new Date(record.date).toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {formatPkTime(record.time_in)}
                                            {' → '}
                                            {record.time_out ? formatPkTime(record.time_out) : 'Not clocked out'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-coral text-sm">{formatDuration(record.duration_minutes)}</p>
                                        <span className={'text-xs px-2 py-0.5 rounded-full font-semibold ' +
                                            (record.time_out ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500')}>
                      {record.time_out ? 'Complete' : 'Incomplete'}
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-3xl p-5">
                    <p className="font-display text-lg text-charcoal mb-4">Module Access</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <ModuleCard
                            enabled={permissions.can_manage_orders}
                            title="Manage Orders"
                            icon="📦"
                            href="/employee/orders"
                            subtitle="View and update order status"
                        />
                        <ModuleCard
                            enabled={permissions.can_manage_products}
                            title="Manage Products"
                            icon="👕"
                            href="/employee/products"
                            subtitle="Update stock and pricing"
                        />
                        <ModuleCard
                            enabled={permissions.can_manage_rewards}
                            title="Reward Points"
                            icon="⭐"
                            href="/employee/rewards"
                            subtitle="View member points summary"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function ModuleCard({ enabled, title, icon, href, subtitle }) {
    if (!enabled) {
        return (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center opacity-70">
                <div className="text-2xl mb-2">{icon}</div>
                <p className="font-display text-base text-charcoal">{title}</p>
                <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                <p className="text-xs text-red-400 mt-2 font-semibold">Disabled by admin</p>
            </div>
        )
    }

    return (
        <a href={href} className="rounded-2xl border-2 border-gray-100 bg-cream p-4 text-center hover:border-coral transition-colors block">
            <div className="text-2xl mb-2">{icon}</div>
            <p className="font-display text-base text-charcoal">{title}</p>
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </a>
    )
}