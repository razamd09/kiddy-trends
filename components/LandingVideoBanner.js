'use client'

import { useEffect, useState } from 'react'

const PROMO_IMAGE_SRC = '/independence-day-banner.png'
const PROMO_STORAGE_KEY = 'kt_landing_promo_state'
const PROMO_CODE = 'KT14OFF'
const PROMO_DISCOUNT = 14
const SHOW_DURATION_MS = 2800
const FADE_DURATION_MS = 450

export default function LandingVideoBanner() {
  const [visible, setVisible] = useState(true)
  const [removed, setRemoved] = useState(false)
  const [status, setStatus] = useState('idle')
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    const hideTimer = window.setTimeout(() => setVisible(false), SHOW_DURATION_MS)
    const removeTimer = window.setTimeout(() => setRemoved(true), SHOW_DURATION_MS + FADE_DURATION_MS)

    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(removeTimer)
    }
  }, [])

  function saveLandingPromo() {
    try {
      localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify({
        activeDiscount: PROMO_DISCOUNT,
        discountCode: PROMO_CODE,
        discountType: 'percentage',
        consumed: false,
        lockedUntil: Date.now() + (24 * 60 * 60 * 1000),
      }))
    } catch {}
  }

  function scrollToCategories() {
    const target = document.getElementById('shop-by-category')
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleAvailDiscount() {
    saveLandingPromo()
    setStatus('applied')
    setVisible(false)
    window.setTimeout(() => scrollToCategories(), 650)
    window.setTimeout(() => setRemoved(true), 1100)
  }

  if (removed) return null

  return (
    <div
      className={
        'fixed inset-0 z-[85] flex items-center justify-center bg-[#f6f1e7]/95 backdrop-blur-md px-4 py-6 transition-opacity duration-500 ' +
        (visible ? 'opacity-100' : 'opacity-0 pointer-events-none')
      }
      aria-hidden="true"
    >
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-white via-[#f9f4ea] to-[#eef4e7] shadow-[0_28px_90px_rgba(60,40,20,0.18)]">
        <div className="pointer-events-none absolute -top-20 -left-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-coral/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-emerald-500 via-coral to-sunny" />

        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] items-center p-6 sm:p-8 lg:p-10">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 shadow-sm">
              Celebrate Independence Day
            </span>
            <h2 className="mt-4 max-w-xl font-display text-4xl sm:text-5xl lg:text-7xl leading-tight text-[#123f2e]">
              Celebrate
              <span className="block text-[#0f6b4c]">Independence Day</span>
              <span className="block text-coral">with Kiddy Trends</span>
            </h2>
            <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-gray-600">
              Tap Avail Discount to apply 14% OFF at checkout. After the message appears, we will take you to Shop by Category.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-gray-600">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm border border-gray-100">Made with love</span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm border border-gray-100">Soft & comfortable</span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm border border-gray-100">Quality you can trust</span>
            </div>

            {status === 'applied' && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#0f6b4c] px-4 py-3 text-white shadow-lg">
                <span className="text-xl">✅</span>
                <span className="font-semibold">14% Off discount code applied on checkout</span>
              </div>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={handleAvailDiscount}
                className="rounded-full bg-gradient-to-r from-coral to-[#ff8a6f] px-8 py-3.5 text-base font-display text-white shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Avail Discount 🎉
              </button>
            </div>
          </div>

          <div className="relative z-10">
            <div className="relative overflow-hidden rounded-[1.75rem] border-4 border-white/90 bg-[#0f6b4c] shadow-2xl">
              {!imageFailed ? (
                <img
                  src={PROMO_IMAGE_SRC}
                  alt="Independence Day promotion for Kiddy Trends"
                  className="h-[320px] w-full object-cover sm:h-[420px]"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="flex h-[320px] w-full flex-col justify-between bg-gradient-to-br from-[#f3f7ef] via-[#e8f1de] to-[#dce8c6] p-5 sm:h-[420px] sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="max-w-[70%] rounded-3xl bg-white/85 px-4 py-3 shadow-sm backdrop-blur-sm">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Kiddy Trends</p>
                      <p className="mt-1 font-display text-xl sm:text-3xl leading-tight text-[#123f2e]">Celebrate Independence Day</p>
                    </div>
                    <div className="rounded-full border-4 border-white bg-[#0f6b4c] px-4 py-3 text-center text-white shadow-lg">
                      <div className="text-3xl sm:text-5xl font-display leading-none">14%</div>
                      <div className="text-xs sm:text-sm font-bold tracking-[0.2em]">OFF</div>
                    </div>
                  </div>

                  <div className="mx-auto flex w-full max-w-md flex-1 items-end justify-center">
                    <div className="relative h-full w-full rounded-[1.5rem] border border-white/70 bg-white/35 shadow-inner backdrop-blur-[2px]">
                      <div className="absolute inset-x-6 top-6 h-12 rounded-full bg-emerald-500/15 blur-xl" />
                      <div className="absolute left-6 bottom-6 rounded-2xl bg-white/90 px-4 py-2 text-sm font-bold text-[#0f6b4c] shadow-md">
                        SHOP NOW
                      </div>
                      <div className="absolute right-5 bottom-5 h-16 w-16 rounded-full bg-[#0f6b4c] shadow-lg" />
                      <div className="absolute right-8 bottom-8 h-10 w-10 rounded-full bg-white" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-sm">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400 font-semibold">Festive preview</p>
                      <p className="font-display text-sm sm:text-base text-charcoal">Auto-hides after a short landing-page preview</p>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      Live
                    </div>
                  </div>
                </div>
              )}

              {!imageFailed && (
                <>
                  <div className="absolute left-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-charcoal shadow-md">
                    Tap to shop
                  </div>
                  <div className="absolute right-4 bottom-4 z-20 rounded-full bg-coral px-3 py-1.5 text-xs font-bold text-white shadow-md animate-bounce2">
                    14% OFF
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}