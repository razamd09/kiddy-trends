'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDiscountCodes() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const router = useRouter()

  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    enabled: false,
    expiry_type: 'unlimited',
    expiry_date: '',
    max_usage: ''
  })

  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
        } else {
          setVerified(true)
          fetchCodes(token)
        }
      } catch {
        router.push('/admin')
      }
    }
    verify()
  }, [])

  async function fetchCodes(token) {
    try {
      const res = await fetch('/api/admin/discount-codes', { headers: { 'x-admin-token': token } })
      const data = await res.json()
      setCodes(data.codes || [])
    } catch (err) {
      console.error('Error fetching codes:', err)
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.code || !form.discount_value) {
      setError('Code and discount value are required')
      return
    }

    if (form.expiry_type === 'limited' && !form.expiry_date) {
      setError('Expiry date is required for limited codes')
      return
    }

    const token = localStorage.getItem('admin_token')
    const method = editing ? 'PUT' : 'POST'
    const body = {
      ...form,
      discount_value: parseFloat(form.discount_value),
      max_usage: form.max_usage ? parseInt(form.max_usage) : null,
      ...(editing && { id: editing.id })
    }

    try {
      const res = await fetch('/api/admin/discount-codes', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error saving code')
        return
      }

      setSuccess(editing ? 'Code updated successfully!' : 'Code created successfully!')
      resetForm()
      fetchCodes(token)
    } catch (err) {
      setError('Error: ' + err.message)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this code?')) return

    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`/api/admin/discount-codes?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token }
      })

      if (!res.ok) {
        setError('Error deleting code')
        return
      }

      setSuccess('Code deleted successfully!')
      fetchCodes(token)
    } catch (err) {
      setError('Error: ' + err.message)
    }
  }

  function handleEdit(code) {
    setEditing(code)
    setForm({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: code.discount_value.toString(),
      enabled: code.enabled,
      expiry_type: code.expiry_type,
      expiry_date: code.expiry_date ? code.expiry_date.split('T')[0] : '',
      max_usage: code.max_usage?.toString() || ''
    })
  }

  function resetForm() {
    setForm({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      enabled: false,
      expiry_type: 'unlimited',
      expiry_date: '',
      max_usage: ''
    })
    setEditing(null)
  }

  function logout() {
    localStorage.removeItem('admin_token')
    router.push('/admin')
  }

  if (!verified) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-coral rounded-2xl flex items-center justify-center text-white font-display text-lg">D</div>
          <div>
            <p className="font-display text-lg text-charcoal">Discount Codes</p>
            <p className="text-xs text-gray-400">Manage promotional codes</p>
          </div>
        </div>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-coral transition-colors">
          Logout →
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-8">
          <h2 className="font-display text-2xl text-charcoal mb-6">
            {editing ? '✏️ Edit Code' : '➕ Add New Discount Code'}
          </h2>

          {error && <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-4 text-red-600 text-sm">{error}</div>}
          {success && <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-4 text-green-600 text-sm">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Discount Code (e.g., SUMMER20)"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm"
              />

              <select
                value={form.discount_type}
                onChange={e => setForm({ ...form, discount_type: e.target.value })}
                className="px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="amount">Fixed Amount (PKR)</option>
              </select>

              <input
                type="number"
                placeholder="Discount Value"
                value={form.discount_value}
                onChange={e => setForm({ ...form, discount_value: e.target.value })}
                step="0.01"
                className="px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm"
              />

              <select
                value={form.expiry_type}
                onChange={e => setForm({ ...form, expiry_type: e.target.value, expiry_date: '' })}
                className="px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm"
              >
                <option value="unlimited">Unlimited Expiry</option>
                <option value="limited">Limited Expiry</option>
              </select>

              {form.expiry_type === 'limited' && (
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={e => setForm({ ...form, expiry_date: e.target.value })}
                  className="px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm"
                />
              )}

              <input
                type="number"
                placeholder="Max Usage (leave empty for unlimited)"
                value={form.max_usage}
                onChange={e => setForm({ ...form, max_usage: e.target.value })}
                className="px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm"
              />

              <div className="flex items-center gap-3 bg-cream p-3 rounded-2xl border-2 border-gray-100">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={form.enabled}
                  onChange={e => setForm({ ...form, enabled: e.target.checked })}
                  className="w-5 h-5 cursor-pointer accent-coral"
                />
                <label htmlFor="enabled" className="text-sm text-charcoal font-medium cursor-pointer flex-1">
                  Enable Code (Display on Landing Page)
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-coral text-white font-display py-3 rounded-2xl hover:bg-opacity-90 transition-all"
              >
                {editing ? '💾 Update Code' : '➕ Add Code'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 bg-gray-100 text-charcoal font-display py-3 rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Codes List */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b-2 border-gray-100">
            <h2 className="font-display text-2xl text-charcoal">All Discount Codes ({codes.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 animate-pulse">Loading codes...</p>
            </div>
          ) : codes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No discount codes yet. Create your first one above! 🎉</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream border-b-2 border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-display text-charcoal">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-display text-charcoal">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-display text-charcoal">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-display text-charcoal">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-display text-charcoal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map(code => (
                    <tr key={code.id} className="border-b border-gray-100 hover:bg-cream/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-coral">{code.code}</span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {code.discount_type === 'percentage'
                          ? `${code.discount_value}% OFF`
                          : `PKR ${code.discount_value}`}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {code.expiry_type === 'unlimited'
                          ? '♾️ Unlimited'
                          : new Date(code.expiry_date) < new Date()
                            ? `❌ Expired (${new Date(code.expiry_date).toLocaleDateString()})`
                            : `✅ ${new Date(code.expiry_date).toLocaleDateString()}`}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-display ${
                          code.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {code.enabled ? '🟢 Enabled' : '⚪ Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(code)}
                          className="text-coral hover:text-coral/70 font-semibold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="text-red-500 hover:text-red-700 font-semibold transition-colors"
                        >
                          Delete
                        </button>
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
