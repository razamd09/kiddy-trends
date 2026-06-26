'use client'
import { useState } from 'react'

export default function RewardsSection({ onRewardsChange }) {
  const [userId, setUserId]         = useState('')
  const [userIdInput, setUserIdInput] = useState('')
  const [userData, setUserData]     = useState(null)
  const [mode, setMode]             = useState('login') // login | register | loggedin
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [redeemPoints, setRedeemPoints] = useState(0)
  const [newUserName, setNewUserName]   = useState('')

  const [registerError, setRegisterError] = useState('')

  async function handleLookup() {
    if (!userIdInput.trim()) return
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/rewards?userId=' + userIdInput.trim())
      const data = await res.json()
      if (data.exists) {
        setUserData(data)
        setUserId(userIdInput.trim())
        setMode('loggedin')
        onRewardsChange({ userId: userIdInput.trim(), points: data.points, redeemed: 0 })
      } else {
        setMode('register')
      }
    } catch { setError('Could not connect. Please try again.') }
    setLoading(false)
  }

  async function handleRegister() {
    if (!newUserName.trim()) {
      setRegisterError('Name is required')
      return
    }
    setLoading(true)
    setRegisterError('')
    try {
      const res  = await fetch('/api/rewards', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdInput.trim(),
          name:   newUserName.trim(),
          phone:  '',
        })
      })
      const data = await res.json()
      if (data.error) {
        setRegisterError(data.error)
      } else {
        setUserData(data)
        setUserId(userIdInput.trim())
        setMode('loggedin')
        onRewardsChange({ userId: userIdInput.trim(), points: 0, redeemed: 0 })
      }
    } catch { setRegisterError('Something went wrong. Please try again.') }
    setLoading(false)
  }

  function handleRedeem(pts) {
    const toRedeem = Math.min(pts, userData.points)
    setRedeemPoints(toRedeem)
    onRewardsChange({ userId, points: userData.points, redeemed: toRedeem })
  }

  function handleRemoveRedeem() {
    setRedeemPoints(0)
    onRewardsChange({ userId, points: userData.points, redeemed: 0 })
  }

  function handleLogout() {
    setUserId('')
    setUserIdInput('')
    setUserData(null)
    setMode('login')
    setRedeemPoints(0)
    onRewardsChange({ userId: '', points: 0, redeemed: 0 })
  }

  return (
    <div className="border-2 border-sunny rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="bg-sunny/30 px-4 py-3 flex items-center gap-2">
        <span className="text-xl">⭐</span>
        <p className="font-display text-base text-charcoal">Kiddy Trends Rewards</p>
        {userData && (
          <span className="ml-auto bg-coral text-white text-xs px-2 py-1 rounded-full font-bold">
            {userData.points} pts
          </span>
        )}
      </div>

      <div className="p-4">

        {/* Login mode */}
        {mode === 'login' && (
          <div>
            <p className="text-xs text-gray-500 mb-3">
              Have a rewards account? Enter your User ID to earn & redeem points!
            </p>
            <div className="flex gap-2">
              <input type="text" placeholder="Enter your User ID"
                value={userIdInput}
                onChange={e => setUserIdInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm bg-cream" />
              <button onClick={handleLookup} disabled={loading || !userIdInput.trim()}
                className="px-4 py-2 bg-charcoal text-white text-sm font-bold rounded-xl hover:bg-coral transition-colors disabled:opacity-50">
                {loading ? '...' : 'Go'}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            <p className="text-xs text-gray-400 mt-2">
              New here? Enter a new User ID to create your account!
            </p>
          </div>
        )}

        {/* Register mode */}
        {mode === 'register' && (
          <div>
            <div className="bg-mint/20 rounded-xl p-3 mb-3">
              <p className="text-sm font-semibold text-charcoal">Create Rewards Account</p>
              <p className="text-xs text-gray-500 mt-0.5">
  WOOW!! 🎉 You are eligible for Rewards Discounts!
</p>
              <p className="text-xs text-gray-500 mt-1">
                Earn <strong>10 pts per PKR 1,000</strong> spent. Redeem 10 pts = PKR 10 off!
              </p>
            </div>
            <div className="space-y-2">
              <input type="text" placeholder="Your full name"
                value={newUserName} onChange={e => setNewUserName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-100 focus:border-coral focus:outline-none text-sm bg-cream" />
              </div>
            {registerError && <p className="text-red-400 text-xs mt-1">{registerError}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setMode('login')}
                className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:border-coral hover:text-coral transition-colors">
                Back
              </button>
              <button onClick={handleRegister} disabled={loading}
                className="flex-1 py-2 rounded-xl bg-coral text-white text-sm font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50">
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        )}

        {/* Logged in mode */}
        {mode === 'loggedin' && userData && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-coral/20 rounded-full flex items-center justify-center font-display text-coral text-sm">
                {userData.name?.[0]?.toUpperCase() || userId[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm text-charcoal">{userData.name || userId}</p>
                <p className="text-xs text-gray-400">ID: {userId}</p>
              </div>
              <button onClick={handleLogout} className="ml-auto text-xs text-gray-400 hover:text-coral">
                Change
              </button>
            </div>

            {/* Points balance */}
            <div className="bg-sunny/20 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Available Points</p>
                  <p className="font-display text-2xl text-charcoal">{userData.points} <span className="text-sm text-gray-400">pts</span></p>
                  <p className="text-xs text-gray-400">= PKR {userData.points} discount</p>
                </div>
                <div className="text-3xl">⭐</div>
              </div>
            </div>

            {/* Redeem */}
            {userData.points >= 10 && redeemPoints === 0 && (
              <button onClick={() => handleRedeem(userData.points)}
                className="w-full py-2.5 rounded-xl bg-mint text-charcoal text-sm font-bold hover:bg-opacity-80 transition-colors">
                Redeem {userData.points} pts (PKR {userData.points} OFF) 🎁
              </button>
            )}

            {redeemPoints > 0 && (
              <div className="flex items-center gap-2 bg-mint/20 rounded-xl px-3 py-2">
                <span className="text-green-600 font-bold text-xs">✓ PKR {redeemPoints} discount applied!</span>
                <button onClick={handleRemoveRedeem}
                  className="ml-auto text-gray-400 hover:text-coral text-xs">✕ Remove</button>
              </div>
            )}

            {userData.points > 0 && userData.points < 10 && redeemPoints === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">
                Collect at least <strong>10 points</strong> to redeem discount.
              </p>
            )}

            {userData.points === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">
                No points yet. Earn 10 pts per PKR 1,000 spent!
              </p>
            )}

            {/* Bonus progress */}
            {!userData.bonus_notified && (
              <div className="mt-3 bg-cream rounded-xl p-2">
                <p className="text-xs text-gray-500">
                  🎁 Reach <strong>500 pts</strong> for a bonus 100 pts from Kiddy Trends!
                  ({Math.max(0, 500 - userData.points)} pts away)
                </p>
                <div className="mt-1.5 bg-gray-200 rounded-full h-1.5">
                  <div className="bg-coral rounded-full h-1.5 transition-all"
                    style={{width: Math.min(100, (userData.points / 500) * 100) + '%'}} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}