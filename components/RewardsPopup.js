'use client'
import { useState, useEffect } from 'react'

export default function RewardsPopup() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Show popup after 2 seconds on first visit
    const seen = sessionStorage.getItem('rewards_popup_seen')
    if (!seen) {
      const timer = setTimeout(() => setShow(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  function handleClose() {
    sessionStorage.setItem('rewards_popup_seen', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Top coral strip */}
        <div className="bg-coral px-6 pt-8 pb-6 text-center relative">
          <button onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="text-5xl mb-3">🎁</div>
          <h2 className="font-display text-3xl text-white leading-tight mb-1">
            Shop & Earn
          </h2>
          <p className="font-display text-4xl text-sunny">
            FREE Discounts!
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6 text-center">
          <p className="text-gray-600 text-base leading-relaxed mb-5">
            🛍️ Choose your favourite products, add them to cart — and at checkout <strong className="text-coral">earn Reward Points</strong> that turn into <strong className="text-coral">real PKR discounts!</strong>
          </p>

          {/* 3 steps */}
          <div className="space-y-3 mb-6 text-left">
            <div className="flex items-center gap-3 bg-cream rounded-2xl px-4 py-3">
              <span className="text-2xl">🛒</span>
              <div>
                <p className="font-display text-sm text-charcoal">Step 1 — Shop</p>
                <p className="text-xs text-gray-500">Pick any product you love</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-cream rounded-2xl px-4 py-3">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="font-display text-sm text-charcoal">Step 2 — Earn Points</p>
                <p className="text-xs text-gray-500">Get 10 pts for every PKR 1,000 spent</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-cream rounded-2xl px-4 py-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-display text-sm text-charcoal">Step 3 — Get Discount</p>
                <p className="text-xs text-gray-500">Redeem 10 pts = PKR 10 OFF instantly!</p>
              </div>
            </div>
          </div>

          {/* Bonus pill */}
          <div className="bg-sunny/30 rounded-2xl px-4 py-3 mb-6">
            <p className="text-sm font-semibold text-charcoal">
              🎉 Reach <strong className="text-coral">500 points</strong> and get a surprise <strong className="text-coral">100 bonus points</strong> from Kiddy Trends!
            </p>
          </div>

          <button onClick={handleClose}
            className="w-full bg-coral text-white font-display text-lg py-4 rounded-2xl hover:bg-opacity-90 transition-all hover:scale-[1.02] shadow-md">
            Start Shopping & Earning! 🛍️
          </button>
          <button onClick={handleClose}
            className="w-full text-gray-400 text-xs mt-3 hover:text-coral transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}