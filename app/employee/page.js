'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function EmployeeLogin() {
    const [employeeId, setEmployeeId] = useState('')
    const [password, setPassword]     = useState('')
    const [loading, setLoading]       = useState(false)
    const [error, setError]           = useState('')
    const router = useRouter()

    async function handleLogin(e) {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res  = await fetch('/api/employee/auth', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ employee_id: employeeId, password })
            })
            const data = await res.json()
            if (data.success) {
                localStorage.setItem('employee', JSON.stringify(data.employee))
                if (data.employee.role === 'admin') {
                    router.push('/admin/dashboard')
                } else {
                    router.push('/employee/dashboard')
                }
            } else {
                setError('Invalid Employee ID or password')
            }
        } catch {
            setError('Something went wrong. Please try again.')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <Image src="/logo.jpg" alt="Kiddy Trends" width={80} height={80} className="rounded-2xl mx-auto mb-4" />
                    <h1 className="font-display text-3xl text-charcoal">Employee Portal</h1>
                    <p className="text-gray-400 text-sm mt-1">Kiddy Trends Staff Login</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block font-semibold text-sm text-charcoal mb-1">Employee ID</label>
                        <input type="text" placeholder="e.g. EMP001"
                               value={employeeId} onChange={e => setEmployeeId(e.target.value.toUpperCase())}
                               className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm font-bold tracking-wider" />
                    </div>
                    <div>
                        <label className="block font-semibold text-sm text-charcoal mb-1">Password</label>
                        <input type="password" placeholder="Enter your password"
                               value={password} onChange={e => setPassword(e.target.value)}
                               className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button type="submit" disabled={loading}
                            className="w-full bg-coral text-white font-display text-lg py-3 rounded-2xl hover:bg-opacity-90 transition-all disabled:opacity-70">
                        {loading ? 'Logging in...' : 'Login 👤'}
                    </button>
                </form>
                <p className="text-center text-xs text-gray-400 mt-4">
                    Admin? <a href="/admin" className="text-coral hover:underline">Click here</a>
                </p>
            </div>
        </div>
    )
}