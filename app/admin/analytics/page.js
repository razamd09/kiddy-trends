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

  if (!verified) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
      </div>
    )
  }

  const funnel = data?.funnel || {}
  const dropOff = data?.dropOff || {}
  const conversion = data?.conversion || {}

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <MetricCard label="Landing Users" value={funnel.landingUsers || 0} color="bg-blue-50" />
              <MetricCard label="Product View" value={funnel.productView || 0} color="bg-mint/20" />
              <MetricCard label="Add To Cart" value={funnel.addToCart || 0} color="bg-sunny/20" />
              <MetricCard label="Checkout Started" value={funnel.checkoutStarted || 0} color="bg-orange-50" />
              <MetricCard label="Checkout Completed" value={funnel.checkoutCompleted || 0} color="bg-emerald-50" />
              <MetricCard label="Landing→Complete" value={(conversion.landingToCompletePct || 0) + '%'} color="bg-coral/10" />
            </div>

            <div className="bg-white rounded-2xl p-5">
              <h2 className="font-display text-lg text-charcoal mb-4">Drop-Off At Each Step</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <Row label="Landing → Product View" dropped={dropOff.landingToView || 0} conv={(conversion.landingToViewPct || 0) + '%'} />
                <Row label="Product View → Add To Cart" dropped={dropOff.viewToCart || 0} conv={(conversion.viewToCartPct || 0) + '%'} />
                <Row label="Add To Cart → Checkout Started" dropped={dropOff.cartToCheckout || 0} conv={(conversion.cartToCheckoutPct || 0) + '%'} />
                <Row label="Checkout Started → Completed" dropped={dropOff.checkoutToComplete || 0} conv={(conversion.checkoutToCompletePct || 0) + '%'} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, color }) {
  return (
    <div className={color + ' rounded-2xl p-4'}>
      <p className="font-display text-2xl text-charcoal">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function Row({ label, dropped, conv }) {
  return (
    <div className="rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
      <div>
        <p className="font-semibold text-charcoal">{label}</p>
        <p className="text-xs text-gray-400">Conversion: {conv}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-400">Drop-off</p>
        <p className="font-display text-lg text-coral">{dropped}</p>
      </div>
    </div>
  )
}
