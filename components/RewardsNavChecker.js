'use client'
import { useState } from 'react'

export default function RewardsNavChecker() {
  const [open, setOpen]       = useState(false)
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
        setError('No account found!')
      }
    } catch { setError('Try again.') }
    setLoading(false)
  }

  return (
    <div className="relative">
      {/* Trigger button */}
      <button onClick={() => { setOpen(!open); setResult(null); setError(''); setUserId('') }}
        className="flex items-center gap-1.5 bg-sunny/40 hover:bg-sunny/60 text-charcoal font-bold text-xs px-3 py-2 rounded-full transition-all animate-pulse hover:animate-none">
        ⭐ Rewards
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden">

            {/* Header */}
            <div className="bg-coral px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-display text-white text-base">⭐ Rewards Points</p>
                <p className="text-white/70 text-xs">Check your balance</p>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs hover:bg-white/40">
                ✕
              </button>
            </div>

            <div className="p-4">
              {!result ? (
                <>
                  <div className="relative mb-2">
                    <input type="text" placeholder="Enter Rewards ID..."
                      value={userId}
                      onChange={e => { setUserId(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleCheck()}
                      autoFocus
                      className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm font-semibold pr-24" />
                    {!userId && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-coral text-white text-xs px-2 py-0.5 rounded-full animate-pulse whitespace-nowrap">
                        🎁 Check!
                      </span>
                    )}
                  </div>
                  {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
                  <button onClick={handleCheck} disabled={loading || !userId.trim()}
                    className="w-full py-2.5 bg-coral text-white font-display text-sm rounded-2xl hover:bg-opacity-90 transition-colors disabled:opacity-50">
                    {loading ? 'Checking...' : 'Check My Points'}
                  </button>
                  <div className="flex justify-between mt-3 text-xs text-gray-400">
                    <span>🛍️ 10 pts/PKR 1000</span>
                    <span>💰 10 pts = PKR 10</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-sunny/20 rounded-2xl p-4 text-center mb-3">
                    <div className="w-10 h-10 bg-coral/20 rounded-full flex items-center justify-center font-display text-coral text-lg mx-auto mb-2">
                      {result.name?.[0]?.toUpperCase() || userId[0]?.toUpperCase()}
                    </div>
                    <p className="font-display text-base text-charcoal">{result.name || userId}</p>
                    <p className="font-display text-3xl text-coral mt-1">{result.points} <span className="text-sm text-gray-400">pts</span></p>
                    <p className="text-xs text-gray-500 mt-0.5">= PKR {result.points} discount at checkout!</p>
                  </div>

                  {!result.bonus_notified && result.points < 500 && (
                    <div className="bg-cream rounded-xl p-3 mb-3">
                      <p className="text-xs text-gray-500 mb-1">
                        🎁 <strong>{500 - result.points} pts</strong> to bonus 100 pts!
                      </p>
                      <div className="bg-gray-200 rounded-full h-1.5">
                        <div className="bg-coral rounded-full h-1.5"
                          style={{width: Math.min(100, (result.points / 500) * 100) + '%'}} />
                      </div>
                    </div>
                  )}

                  {result.bonus_notified && (
                    <div className="bg-mint/20 rounded-xl p-2 mb-3 text-center">
                      <p className="text-xs text-green-600 font-bold">🏆 VIP Member!</p>
                    </div>
                  )}

                  <button onClick={() => { setResult(null); setUserId('') }}
                    className="w-full py-2 border-2 border-gray-200 text-charcoal font-semibold text-xs rounded-2xl hover:border-coral hover:text-coral transition-colors">
                    Check Another ID
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}