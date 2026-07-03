'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function EmployeeDashboard() {
    const [employee, setEmployee]     = useState(null)
    const [attendance, setAttendance] = useState(null)
    const [loading, setLoading]       = useState(false)
    const [message, setMessage]       = useState('')
    const [time, setTime]             = useState(new Date())
    const [history, setHistory]       = useState([])
    const router = useRouter()

    useEffect(() => {
        const stored = localStorage.getItem('employee')
        if (!stored) { router.push('/admin'); return }
        const emp = JSON.parse(stored)
        setEmployee(emp)
        fetchTodayAttendance(emp.employee_id)
        fetchHistory(emp.employee_id)

        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    async function fetchTodayAttendance(empId) {
        const res  = await fetch('/api/admin/attendance?employee_id=' + empId + '&period=daily')
        const data = await res.json()
        if (data.attendance?.length > 0) setAttendance(data.attendance[0])
    }

    async function fetchHistory(empId) {
        const res  = await fetch('/api/admin/attendance?employee_id=' + empId + '&period=monthly')
        const data = await res.json()
        setHistory(data.attendance || [])
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
            setMessage('✅ Time In recorded at ' + new Date().toLocaleTimeString())
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
            setMessage('✅ Time Out recorded at ' + new Date().toLocaleTimeString())
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

    function handleLogout() {
        localStorage.removeItem('employee')
        router.push('/admin')
    }

    if (!employee) return null

    return (
        <div className="min-h-screen bg-cream">
            {/* Header */}
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Image src="/logo.jpg" alt="Kiddy Trends" width={40} height={40} className="rounded-xl" />
                    <div>
                        <p className="font-display text-lg text-charcoal">{employee.name}</p>
                        <p className="text-xs text-gray-400">{employee.employee_id} · {employee.role}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-coral">Logout →</button>
            </div>

            <div className="max-w-lg mx-auto px-4 py-8 space-y-5">

                {/* Clock */}
                <div className="bg-charcoal rounded-3xl p-6 text-center">
                    <p className="text-gray-400 text-sm mb-1">{time.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="font-display text-5xl text-white">{time.toLocaleTimeString('en-PK')}</p>
                </div>

                {/* Today status */}
                <div className="bg-white rounded-3xl p-5">
                    <p className="font-display text-lg text-charcoal mb-4">Today's Attendance</p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-cream rounded-2xl p-4 text-center">
                            <p className="text-xs text-gray-400 mb-1">Time In</p>
                            <p className="font-display text-xl text-coral">
                                {attendance?.time_in ? new Date(attendance.time_in).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </p>
                        </div>
                        <div className="bg-cream rounded-2xl p-4 text-center">
                            <p className="text-xs text-gray-400 mb-1">Time Out</p>
                            <p className="font-display text-xl text-coral">
                                {attendance?.time_out ? new Date(attendance.time_out).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </p>
                        </div>
                    </div>

                    {attendance?.duration_minutes && (
                        <div className="bg-mint/20 rounded-2xl p-3 text-center mb-4">
                            <p className="text-sm text-charcoal">Total Hours Today: <strong className="text-coral">{formatDuration(attendance.duration_minutes)}</strong></p>
                        </div>
                    )}

                    {message && (
                        <div className="bg-sunny/20 rounded-2xl p-3 text-center mb-4">
                            <p className="text-sm text-charcoal">{message}</p>
                        </div>
                    )}

                    {/* Buttons */}
                    {!attendance ? (
                        <button onClick={handleTimeIn} disabled={loading}
                                className="w-full bg-coral text-white font-display text-lg py-4 rounded-2xl hover:bg-opacity-90 transition-all disabled:opacity-70">
                            {loading ? 'Recording...' : '🟢 Time In'}
                        </button>
                    ) : !attendance.time_out ? (
                        <button onClick={handleTimeOut} disabled={loading}
                                className="w-full bg-charcoal text-white font-display text-lg py-4 rounded-2xl hover:bg-opacity-90 transition-all disabled:opacity-70">
                            {loading ? 'Recording...' : '🔴 Time Out'}
                        </button>
                    ) : (
                        <div className="bg-green-50 rounded-2xl p-4 text-center">
                            <p className="text-2xl mb-1">✅</p>
                            <p className="font-display text-green-600">Attendance Complete!</p>
                            <p className="text-xs text-gray-400 mt-1">You've clocked in and out today</p>
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
                                        <p className="font-semibold text-sm text-charcoal">{new Date(record.date).toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                        <p className="text-xs text-gray-400">
                                            {record.time_in ? new Date(record.time_in).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                            {' → '}
                                            {record.time_out ? new Date(record.time_out).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : 'Not clocked out'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-coral text-sm">{formatDuration(record.duration_minutes)}</p>
                                        <span className={'text-xs px-2 py-0.5 rounded-full font-semibold ' + (record.time_out ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500')}>
                      {record.time_out ? 'Complete' : 'Incomplete'}
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}