'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminAnalyticsPage() {
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [setupMessage, setSetupMessage] = useState('')
  const [selectedAction, setSelectedAction] = useState('landingWebsite')
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [detailsRows, setDetailsRows] = useState([])
  const router = useRouter()

  useEffect(() => {
    async function verify() {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        router.push('/admin')
        return
      }

      try {
        const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
        const result = await res.json().catch(() => ({}))
        if (!result.valid) {
          localStorage.removeItem('admin_token')
          router.push('/admin')
          return
        }
        setVerified(true)
      } catch {
        router.push('/admin')
      }
    }

    verify()
  }, [router])

  useEffect(() => {
    if (!verified) return

    async function load() {
      setLoading(true)
      setError('')
      setSetupMessage('')
      try {
        const token = localStorage.getItem('admin_token') || ''
        const res = await fetch('/api/admin/analytics/funnel?days=' + days, {
          headers: { 'x-admin-token': token },
          cache: 'no-store',
        })
        const result = await res.json().catch(() => ({}))
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Failed to load analytics')
        }
        if (result.setupRequired) {
          setSetupMessage(result.setupMessage || 'Analytics storage is not initialized yet.')
        }
        setData(result)
      } catch (err) {
        setError(err.message || 'Failed to load analytics')
      }
      setLoading(false)
    }

    load()
  }, [verified, days])

  useEffect(() => {
    if (!verified || !selectedAction) return

    async function loadDetails() {
      setDetailsLoading(true)
      setDetailsError('')
      try {
        const token = localStorage.getItem('admin_token') || ''
        const res = await fetch('/api/admin/analytics/action-details?action=' + selectedAction + '&days=' + days, {
          headers: { 'x-admin-token': token },
          cache: 'no-store',
        })
        const result = await res.json().catch(() => ({}))
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Failed to load action details')
        }
        setDetailsRows(Array.isArray(result.rows) ? result.rows : [])
      } catch (err) {
        setDetailsRows([])
        setDetailsError(err.message || 'Failed to load action details')
      }
      setDetailsLoading(false)
    }

    loadDetails()
  }, [verified, selectedAction, days])

  if (!verified) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
      </div>
    )
  }

  const actions = data?.actions || {}
  const actionCards = [
    { key: 'landingWebsite', label: 'Landing on Website', value: actions.landingWebsite || 0, color: 'bg-blue-50' },
    { key: 'productViews', label: 'Product Views', value: actions.productViews || 0, color: 'bg-mint/20' },
    { key: 'addToCart', label: 'Add to Cart', value: actions.addToCart || 0, color: 'bg-sunny/20' },
    { key: 'checkoutInitiated', label: 'Checkout Initiated', value: actions.checkoutInitiated || 0, color: 'bg-orange-50' },
    { key: 'checkoutCompleted', label: 'Checkout Completed', value: actions.checkoutCompleted || 0, color: 'bg-emerald-50' },
  ]

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
          <h1 className="font-display text-xl text-charcoal">Analytics Funnel</h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Range:</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="bg-white rounded-2xl p-4 border border-red-100 text-red-500 text-sm">{error}</div>
        )}

        {setupMessage && (
          <div className="bg-white rounded-2xl p-4 border border-amber-100 text-amber-700 text-sm">
            {setupMessage}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-gray-400">Loading analytics...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {actionCards.map((card) => (
                <MetricCard
                  key={card.key}
                  label={card.label}
                  value={card.value}
                  color={card.color}
                  active={selectedAction === card.key}
                  onClick={() => setSelectedAction(card.key)}
                />
              ))}
            </div>

            <div className="bg-white rounded-2xl p-5">
              <h2 className="font-display text-lg text-charcoal mb-2">Action-Based Tracking</h2>
              <p className="text-sm text-gray-500">
                Each metric is tracked independently (not as a sequence), exactly as actions happen on the website.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg text-charcoal">Action Details</h2>
                <span className="text-xs text-gray-500">Selected: {actionCards.find((c) => c.key === selectedAction)?.label || '-'}</span>
              </div>

              {detailsError && (
                <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{detailsError}</div>
              )}

              {detailsLoading ? (
                <p className="text-sm text-gray-500">Loading details...</p>
              ) : detailsRows.length === 0 ? (
                <p className="text-sm text-gray-500">No records found for selected action in this range.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="py-2 pr-3 whitespace-nowrap">Time</th>
                        <th className="py-2 pr-3 whitespace-nowrap">IP</th>
                        <th className="py-2 pr-3 whitespace-nowrap">User Agent</th>
                        <th className="py-2 pr-3 whitespace-nowrap">Path</th>
                        <th className="py-2 pr-3 whitespace-nowrap">Referrer</th>
                        <th className="py-2 pr-3 whitespace-nowrap">Session</th>
                        <th className="py-2 pr-3 whitespace-nowrap">Product</th>
                        <th className="py-2 pr-3 whitespace-nowrap">Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsRows.map((row) => (
                        <tr key={row.id} className="border-b border-gray-50 align-top">
                          <td className="py-2 pr-3 whitespace-nowrap text-gray-700">{formatDateTime(row.created_at)}</td>
                          <td className="py-2 pr-3 whitespace-nowrap text-gray-700">{row.ip || '-'}</td>
                          <td className="py-2 pr-3 text-gray-700 min-w-[280px] break-words">{row.user_agent || '-'}</td>
                          <td className="py-2 pr-3 text-gray-700 break-words">{row.path || '-'}</td>
                          <td className="py-2 pr-3 text-gray-700 break-words">{row.referrer || '-'}</td>
                          <td className="py-2 pr-3 text-gray-700 break-all">{row.session_id || '-'}</td>
                          <td className="py-2 pr-3 text-gray-700 break-all">{row.product_id || '-'}</td>
                          <td className="py-2 pr-3 text-gray-700 break-all">{row.order_number || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, color, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        color +
        ' rounded-2xl p-4 text-left transition-all border ' +
        (active ? 'border-coral ring-2 ring-coral/20' : 'border-transparent hover:border-coral/30')
      }
    >
      <p className="font-display text-2xl text-charcoal">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </button>
  )
}

function formatDateTime(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '-'
  return date.toLocaleString()
}
