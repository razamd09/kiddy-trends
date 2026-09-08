'use client'
import { useEffect, useState } from 'react'

export default function RewardsSection({ phone, onRewardsChange }) {
  const [rewardsData, setRewardsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [redeemed, setRedeemed] = useState(0)
  const [lastLookedUpPhone, setLastLookedUpPhone] = useState('')

  useEffect(() => {
    if (!phone || phone.length !== 10) {
      setRewardsData(null)
      setRedeemed(0)
      onRewardsChange({ phone: '', points: 0, redeemed: 0 })
      return
    }

    if (phone === lastLookedUpPhone) return

    let cancelled = false
    async function lookup() {
      setLoading(true)
      try {
        const res = await fetch('/api/rewards?phone=' + phone, { cache: 'no-store' })
        const data = await res.json()
        if (cancelled) return
        const points = data.exists ? Number(data.points || 0) : 0
        setRewardsData(data.exists ? data : null)
        setRedeemed(0)
        setLastLookedUpPhone(phone)
        onRewardsChange({ phone, points, redeemed: 0 })
      } catch {
        if (!cancelled) setLastLookedUpPhone(phone)
      }
      if (!cancelled) setLoading(false)
    }
    lookup()
    return () => { cancelled = true }
  }, [phone])

  function handleRedeem() {
    if (!rewardsData) return
    const toRedeem = rewardsData.points
    setRedeemed(toRedeem)
    onRewardsChange({ phone, points: rewardsData.points, redeemed: toRedeem })
  }

  function handleRemoveRedeem() {
    setRedeemed(0)
    onRewardsChange({ phone, points: rewardsData?.points || 0, redeemed: 0 })
  }

  if (!phone || phone.length !== 10) return null

  const points = rewardsData?.points || 0

  return (
    <div className="border-2 border-sunny rounded-2xl overflow-hidden">
      <div className="bg-sunny/30 px-4 py-3 flex items-center gap-2">
        <span className="text-xl">⭐</span>
        <p className="font-display text-base text-charcoal">Kiddy Trends Rewards</p>
        <span className="ml-auto bg-coral text-white text-xs px-2 py-1 rounded-full font-bold">
          {loading ? '...' : points + ' pts'}
        </span>
      </div>

      <div className="p-4">
        {/* Uneditable points balance, tied to the phone number entered above */}
        <div className="bg-sunny/20 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Reward Points for +92{phone}</p>
              <p className="font-display text-2xl text-charcoal">{loading ? '...' : points} <span className="text-sm text-gray-400">pts</span></p>
              <p className="text-xs text-gray-400">= PKR {points} discount</p>
            </div>
            <div className="text-3xl">⭐</div>
          </div>
        </div>

        {!loading && points >= 10 && redeemed === 0 && (
          <button type="button" onClick={handleRedeem}
            className="w-full py-2.5 rounded-xl bg-mint text-charcoal text-sm font-bold hover:bg-opacity-80 transition-colors">
            Redeem {points} pts (PKR {points} OFF) 🎁
          </button>
        )}

        {redeemed > 0 && (
          <div className="flex items-center gap-2 bg-mint/20 rounded-xl px-3 py-2">
            <span className="text-green-600 font-bold text-xs">✓ PKR {redeemed} discount applied!</span>
            <button type="button" onClick={handleRemoveRedeem}
              className="ml-auto text-gray-400 hover:text-coral text-xs">✕ Remove</button>
          </div>
        )}

        {!loading && points > 0 && points < 10 && redeemed === 0 && (
          <p className="text-xs text-gray-500 text-center py-2">
            Collect at least <strong>10 points</strong> to redeem discount.
          </p>
        )}

        {!loading && points === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">
            No points yet. Earn 25 pts per PKR 1,000 spent — this order will start your balance!
          </p>
        )}

        {rewardsData && !rewardsData.bonus_notified && (
          <div className="mt-3 bg-cream rounded-xl p-2">
            <p className="text-xs text-gray-500">
              🎁 Reach <strong>500 pts</strong> for a bonus 100 pts from Kiddy Trends!
              ({Math.max(0, 500 - points)} pts away)
            </p>
            <div className="mt-1.5 bg-gray-200 rounded-full h-1.5">
              <div className="bg-coral rounded-full h-1.5 transition-all"
                style={{width: Math.min(100, (points / 500) * 100) + '%'}} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
