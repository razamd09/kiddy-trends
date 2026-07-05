'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function calculateShippingPreview(flatPrice, percentage, subtotal) {
  const flat = Math.max(0, toNumber(flatPrice))
  const pct = Math.max(0, toNumber(percentage))
  return Math.round(flat + (subtotal * pct) / 100)
}

export default function AdminShippingRatesPage() {
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rates, setRates] = useState([])
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    flat_price: '',
    shipping_percentage: '',
    is_active: true,
  })

  useEffect(() => {
    async function verify() {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        router.push('/admin')
        return
      }
      try {
        const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
        const data = await res.json()
        if (!data.valid) {
          localStorage.removeItem('admin_token')
          router.push('/admin')
          return
        }
        setVerified(true)
        fetchRates(token)
      } catch {
        router.push('/admin')
      }
    }
    verify()
  }, [])

  async function fetchRates(token) {
    try {
      const res = await fetch('/api/admin/shipping-rates', {
        headers: { 'x-admin-token': token },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load shipping rates')
        return
      }
      setRates(data.rates || [])
    } catch (err) {
      setError(err.message || 'Failed to load shipping rates')
    }
    setLoading(false)
  }

  function resetForm() {
    setForm({
      name: '',
      flat_price: '',
      shipping_percentage: '',
      is_active: true,
    })
    setEditing(null)
  }

  function handleEdit(rate) {
    setEditing(rate)
    setForm({
      name: rate.name || '',
      flat_price: String(rate.flat_price ?? ''),
      shipping_percentage: String(rate.shipping_percentage ?? ''),
      is_active: !!rate.is_active,
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name.trim()) {
      setError('Rate name is required')
      return
    }

    const flatPrice = Number(form.flat_price)
    const shippingPercentage = Number(form.shipping_percentage)

    if (!Number.isFinite(flatPrice) || flatPrice < 0) {
      setError('Flat price must be a non-negative number')
      return
    }

    if (!Number.isFinite(shippingPercentage) || shippingPercentage < 0) {
      setError('Shipping percentage must be a non-negative number')
      return
    }

    const token = localStorage.getItem('admin_token')
    const method = editing ? 'PUT' : 'POST'

    try {
      const res = await fetch('/api/admin/shipping-rates', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({
          ...(editing ? { id: editing.id } : {}),
          name: form.name.trim(),
          flat_price: flatPrice,
          shipping_percentage: shippingPercentage,
          is_active: form.is_active,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save shipping rate')
        return
      }

      setSuccess(editing ? 'Shipping rate updated successfully!' : 'Shipping rate added successfully!')
      resetForm()
      fetchRates(token)
    } catch (err) {
      setError(err.message || 'Failed to save shipping rate')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this shipping rate?')) return

    const token = localStorage.getItem('admin_token')
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/shipping-rates?id=' + id, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to delete shipping rate')
        return
      }

      setSuccess('Shipping rate deleted successfully!')
      fetchRates(token)
    } catch (err) {
      setError(err.message || 'Failed to delete shipping rate')
    }
  }

  function logout() {
    localStorage.removeItem('admin_token')
    router.push('/admin')
  }

  const previewAmount = calculateShippingPreview(form.flat_price || 0, form.shipping_percentage || 0, 1000)

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
          <div className="w-10 h-10 bg-coral rounded-2xl flex items-center justify-center text-white font-display text-lg">S</div>
          <div>
            <p className="font-display text-lg text-charcoal">Shipping Rates</p>
            <p className="text-xs text-gray-400">Manage checkout shipping formula</p>
          </div>
        </div>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-coral transition-colors">
          Logout →
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-8">
          <h2 className="font-display text-2xl text-charcoal mb-6">
            {editing ? '✏️ Edit Shipping Rate' : '➕ Add Shipping Rate'}
          </h2>

          {error && <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-4 text-red-600 text-sm">{error}</div>}
          {success && <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-4 text-green-600 text-sm">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Rate Name (e.g., Standard Pakistan Shipping)"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm"
              />

              <input
                type="number"
                placeholder="Flat Price (PKR)"
                value={form.flat_price}
                onChange={e => setForm({ ...form, flat_price: e.target.value })}
                min="0"
                step="0.01"
                className="px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm"
              />

              <input
                type="number"
                placeholder="Shipping Percentage (%)"
                value={form.shipping_percentage}
                onChange={e => setForm({ ...form, shipping_percentage: e.target.value })}
                min="0"
                step="0.01"
                className="px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm"
              />

              <div className="flex items-center gap-3 bg-cream p-3 rounded-2xl border-2 border-gray-100">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 cursor-pointer accent-coral"
                />
                <label htmlFor="is_active" className="text-sm text-charcoal font-medium cursor-pointer flex-1">
                  Active rate (applied on checkout)
                </label>
              </div>
            </div>

            <div className="bg-cream rounded-2xl p-4 text-sm text-charcoal">
              Formula: <strong>Shipping = Flat Price + (Subtotal × Shipping % / 100)</strong>
              <p className="mt-1 text-gray-500">Preview for subtotal PKR 1,000: <strong className="text-coral">PKR {previewAmount.toLocaleString()}</strong></p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-coral text-white font-display py-3 rounded-2xl hover:bg-opacity-90 transition-all">
                {editing ? '💾 Update Rate' : '➕ Add Rate'}
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

        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b-2 border-gray-100">
            <h2 className="font-display text-2xl text-charcoal">All Shipping Rates ({rates.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 animate-pulse">Loading shipping rates...</p>
            </div>
          ) : rates.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No shipping rates yet. Create your first one above! 🚚</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream border-b-2 border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-display text-charcoal">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-display text-charcoal">Flat Price</th>
                    <th className="px-6 py-3 text-left text-xs font-display text-charcoal">Shipping %</th>
                    <th className="px-6 py-3 text-left text-xs font-display text-charcoal">Preview (1,000)</th>
                    <th className="px-6 py-3 text-left text-xs font-display text-charcoal">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-display text-charcoal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map(rate => (
                    <tr key={rate.id} className="border-b border-gray-100 hover:bg-cream/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-charcoal">{rate.name}</td>
                      <td className="px-6 py-4 text-sm">PKR {Number(rate.flat_price || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">{Number(rate.shipping_percentage || 0)}%</td>
                      <td className="px-6 py-4 text-sm font-semibold text-coral">
                        PKR {calculateShippingPreview(rate.flat_price, rate.shipping_percentage, 1000).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={'inline-block px-3 py-1 rounded-full text-xs font-display ' + (
                          rate.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        )}>
                          {rate.is_active ? '🟢 Active' : '⚪ Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(rate)}
                          className="text-coral hover:text-coral/70 font-semibold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rate.id)}
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
