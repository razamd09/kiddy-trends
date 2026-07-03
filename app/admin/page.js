'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// Single unified login for the whole team. User ID + password; the response
// role decides whether we land on the admin portal or the staff dashboard.
export default function Login() {
  const [userId, setUserId]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user_id: userId, password })
      })
      const data = await res.json()
      if (data.success) {
        if (data.role === 'admin') {
          localStorage.setItem('admin_token', data.token)
          if (data.employee) localStorage.setItem('employee', JSON.stringify(data.employee))
          router.push('/admin/dashboard')
        } else {
          localStorage.removeItem('admin_token')
          localStorage.setItem('employee', JSON.stringify(data.employee))
          router.push('/employee/dashboard')
        }
      } else {
        setError(data.error || 'Invalid User ID or password. Please try again.')
      }
    } catch (err) {
      setError('Error: ' + (err.message || 'Something went wrong. Please try again.'))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Image src="/logo.jpg" alt="Kiddy Trends" width={80} height={80} className="rounded-2xl mx-auto mb-4" />
          <h1 className="font-display text-3xl text-charcoal">Kiddy Trends Portal</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to continue</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-semibold text-sm text-charcoal mb-1">User ID</label>
            <input type="text" placeholder="e.g. admin or EMP001"
              value={userId} onChange={e => setUserId(e.target.value)}
              autoCapitalize="none" autoCorrect="off"
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm font-semibold tracking-wide" />
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
            {loading ? 'Logging in...' : 'Login 🔐'}
          </button>
        </form>
      </div>
    </div>
  )
}
