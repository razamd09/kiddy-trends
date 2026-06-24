'use client'
import { useState } from 'react'

export default function RewardsChecker() {
  const [userId, setUserId]   = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleCheck() {
    if (!userId.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res  = await fetch('/api/rewards?userId=' + userId.trim())
      const data = await res.json()
      if (data.exists) {
        setResult(data)
      } else {
        setError('No account found. Create one at checkout!')
      }
    } catch { setError('Could not connect. Please try again.') }
    setLoading(false)
  }

  return (
    <div className="bg-gradient-to-r from-sunny/40 to-coral/20 rounded-3xl p-8 md:p-10">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-4xl mb-3">⭐</div>
        <h2 className="font-display text-3xl text-charcoal mb-2">Check Your Reward Points!</h2>
        <p className="text-gray-600 mb-6">
          Enter your Rewards ID to see your points balance and discounts available.
          Earn <strong>10 pts</strong> for every <strong>PKR 1,000</strong> spent!
        </p>

        <div className="flex gap-3 max-w-md mx-auto mb-4">
          <input type="text" placeholder="Enter your Rewards ID..."
            value={userId}
            onChange={e => { setUserId(e.target.value); setResult(null); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleCheck()}
            className="flex-1 px-5 py-3 rounded-2xl border-2 border-white focus:border-coral focus:outline-none bg-white text-sm font-semibold shadow-sm" />
          <button onClick={handleCheck} disabled={loading || !userId.trim()}
            className="px-6 py-3 bg-coral text-white font-display rounded-2xl hover:bg-opacity-90 transition-all hover:scale-105 disabled:opacity-50 shadow-sm">
            {loading ? '...' : 'Check'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-white rounded-2xl px-5 py-3 inline-block">
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl p-5 max-w-sm mx-auto shadow-sm mt-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-coral/20 rounded-full flex items-center justify-center font-display text-coral text-lg">
                {result.name?.[0]?.toUpperCase() || userId[0]?.toUpperCase()}
              </div>
              <div className="text-left">
                <p className="font-display text-base text-charcoal">{result.name || userId}</p>
                <p className="text-xs text-gray-400">ID: {userId}</p>
              </div>
            </div>

            <div className="bg-sunny/20 rounded-xl p-4 mb-3">
              <p className="text-xs text-gray-500 mb-1">Your Points Balance</p>
              <p className="font-display text-4xl text-charcoal">{result.points} <span className="text-lg text-gray-400">pts</span></p>
              <p className="text-sm text-coral font-semibold mt-1">= PKR {result.points} discount available!</p>
            </div>

            {/* Bonus progress */}
            {!result.bonus_notified && result.points < 500 && (
              <div className="bg-cream rounded-xl p-3 text-left">
                <p className="text-xs text-gray-500 mb-1.5">
                  🎁 <strong>{500 - result.points} pts</strong> away from 100 bonus points!
                </p>
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-coral rounded-full h-2 transition-all"
                    style={{width: Math.min(100, (result.points / 500) * 100) + '%'}} />
                </div>
              </div>
            )}

            {result.bonus_notified && (
              <div className="bg-mint/20 rounded-xl p-3 text-left">
                <p className="text-xs text-green-600 font-semibold">🏆 VIP Member! You've earned the 500pts bonus!</p>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-3">
              Redeem your points at checkout for instant discount!
            </p>
          </div>
        )}

        {/* Info pills */}
        {!result && !error && (
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <span className="bg-white text-charcoal text-xs px-4 py-2 rounded-full font-semibold shadow-sm">
              🛍️ 10 pts per PKR 1,000
            </span>
            <span className="bg-white text-charcoal text-xs px-4 py-2 rounded-full font-semibold shadow-sm">
              💰 10 pts = PKR 10 OFF
            </span>
            <span className="bg-white text-charcoal text-xs px-4 py-2 rounded-full font-semibold shadow-sm">
              🎁 500 pts = Bonus 100 pts
            </span>
          </div>
        )}
      </div>
    </div>
  )
}