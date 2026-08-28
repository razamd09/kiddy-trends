'use client'
import { useState } from 'react'

function RewardIcon({ name, className = 'w-5 h-5' }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    reward: <path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" />,
    discount: <><path d="M4 7h16v10H4z" /><path d="M8 11h.01M16 13h.01M9 15l6-6" /></>,
    points: <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9 10h4a2 2 0 1 1 0 4H9" /></>,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4a1 1 0 0 0-1 1 4 4 0 0 0 4 4M17 5h3a1 1 0 0 1 1 1 4 4 0 0 1-4 4" /></>,
  }
  return <svg {...common}>{paths[name]}</svg>
}

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
      const res  = await fetch('/api/rewards?userId=' + userId.trim().toLowerCase(), { cache: 'no-store' })
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
    <div className="border border-gray-200 rounded-2xl p-8 md:p-10 bg-white">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-coral/10 flex items-center justify-center">
          <RewardIcon name="reward" className="w-6 h-6 text-coral" />
        </div>
        <h2 className="font-display text-3xl text-charcoal mb-2">Check Your Reward Points</h2>
        <p className="text-gray-500 mb-7">
          Enter your Rewards ID to see your points balance and discounts available.
          Earn <strong className="text-charcoal">25 pts</strong> for every <strong className="text-charcoal">PKR 1,000</strong> spent.
        </p>

        {/* Search field */}
        <div className="flex gap-3 max-w-md mx-auto mb-6">
          <input type="text" placeholder="Enter your Rewards ID..."
            value={userId}
            onChange={e => { setUserId(e.target.value); setResult(null); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleCheck()}
            className="flex-1 px-5 py-3 rounded-xl border border-gray-200 focus:border-coral focus:outline-none text-sm" />
          <button onClick={handleCheck} disabled={loading || !userId.trim()}
            className="px-6 py-3 bg-coral text-white font-display text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 whitespace-nowrap">
            {loading ? 'Checking...' : 'Check'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="border border-gray-200 rounded-xl px-5 py-3 inline-block mb-2">
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="border border-gray-200 rounded-xl p-5 max-w-sm mx-auto mt-2 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-coral/10 rounded-full flex items-center justify-center font-display text-coral text-lg">
                {result.name?.[0]?.toUpperCase() || userId[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-display text-base text-charcoal">{result.name || userId}</p>
                <p className="text-xs text-gray-400">ID: {userId}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-3">
              <p className="text-xs text-gray-500 mb-1">Your Points Balance</p>
              <p className="font-display text-4xl text-charcoal">{result.points} <span className="text-lg text-gray-400">pts</span></p>
              <p className="text-sm text-coral font-semibold mt-1">= PKR {result.points} discount available</p>
            </div>
            {!result.bonus_notified && result.points < 500 && (
              <div className="rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <RewardIcon name="reward" className="w-3.5 h-3.5 text-coral" />
                  <strong className="text-charcoal">{500 - result.points} pts</strong> away from 100 bonus points
                </p>
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-coral rounded-full h-2 transition-all"
                    style={{width: Math.min(100, (result.points / 500) * 100) + '%'}} />
                </div>
              </div>
            )}
            {result.bonus_notified && (
              <div className="bg-coral/5 rounded-xl p-3 flex items-center gap-2">
                <RewardIcon name="trophy" className="w-4 h-4 text-coral" />
                <p className="text-xs text-coral font-semibold">VIP Member — you've earned the 500pt bonus!</p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3">Redeem your points at checkout for an instant discount.</p>
          </div>
        )}

        {/* Info pills */}
        {!result && !error && (
          <div className="flex flex-wrap justify-center gap-3">
            <span className="border border-gray-200 text-charcoal text-xs px-4 py-2 rounded-full font-medium inline-flex items-center gap-1.5">
              <RewardIcon name="points" className="w-4 h-4 text-coral" />25 pts per PKR 1,000
            </span>
            <span className="border border-gray-200 text-charcoal text-xs px-4 py-2 rounded-full font-medium inline-flex items-center gap-1.5">
              <RewardIcon name="discount" className="w-4 h-4 text-coral" />10 pts = PKR 10 off
            </span>
            <span className="border border-gray-200 text-charcoal text-xs px-4 py-2 rounded-full font-medium inline-flex items-center gap-1.5">
              <RewardIcon name="reward" className="w-4 h-4 text-coral" />500 pts = bonus 100 pts
            </span>
          </div>
        )}
      </div>
    </div>
  )
}