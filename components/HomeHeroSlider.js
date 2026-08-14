'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const SLIDE_COUNT = 2
const AUTOPLAY_MS = 4000
const LANDING_PROMO_STORAGE_KEY = 'kt_landing_promo_state'
const LANDING_PROMO_CODE = '14August'
const LANDING_PROMO_PERCENT = 14

function ChevronIcon({ direction = 'left' }) {
  const d = direction === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Landing hero carousel: slide 1 = Kiddy Trends brand block, slide 2 =
// Independence Day offer image. Auto-rotates and pauses on hover.
export default function HomeHeroSlider() {
  const [index, setIndex] = useState(0)
  const [promoApplied, setPromoApplied] = useState(false)
  const paused = useRef(false)

  useEffect(() => {
    const id = setInterval(() => {
      if (!paused.current) setIndex(i => (i + 1) % SLIDE_COUNT)
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [])

  function go(i) { setIndex((i + SLIDE_COUNT) % SLIDE_COUNT) }

  function applyLandingDiscount() {
    try {
      localStorage.setItem(LANDING_PROMO_STORAGE_KEY, JSON.stringify({
        activeDiscount: LANDING_PROMO_PERCENT,
        discountCode: LANDING_PROMO_CODE,
        discountType: 'percentage',
        consumed: false,
        lockedUntil: Date.now() + (24 * 60 * 60 * 1000),
      }))
      setPromoApplied(true)
      window.setTimeout(() => setPromoApplied(false), 3500)
    } catch {}
  }

  return (
    <div className="relative w-full overflow-hidden"
         onMouseEnter={() => { paused.current = true }}
         onMouseLeave={() => { paused.current = false }}>

      {/* Track */}
      <div className="flex transition-transform duration-700 ease-in-out items-stretch"
           style={{ transform: `translateX(-${index * 100}%)` }}>

        {/* Slide 1 — Kiddy Trends brand block */}
        <div className="w-full flex-shrink-0">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 h-full">
            <div className="grid md:grid-cols-2 gap-10 items-center h-full">
              <div className="animate-fade-up">
                <span className="inline-block bg-cream text-charcoal font-display text-sm px-4 py-1.5 rounded-full mb-5 border border-charcoal/10">
                  Newborn to 12 years
                </span>
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-charcoal leading-tight mb-6">
                  Dress them
                  <span className="text-coral block">to impress.</span>
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-md">
                  Kiddy Trends brings you the cutest, comfiest clothes, bedding, bags
                  and accessories for little explorers. Because every day is a fashion adventure.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/collections" className="btn-primary">Shop now</Link>
                  <Link href="/about" className="btn-outline">Our story</Link>
                </div>
              </div>

              {/* Replace this placeholder with a real lifestyle photo once available:
                  <Image src="/hero-kid.jpg" alt="Child wearing a Kiddy Trends outfit"
                         width={520} height={520} className="rounded-3xl object-cover w-full h-full" priority />
              */}
              <div className="relative flex justify-center px-6">
  <div className="w-full max-w-md aspect-square rounded-3xl overflow-hidden">
    <Image src="/sale-1947.png" alt="19 to 47 percent Independence Day sale" width={520} height={520} className="w-full h-full object-cover" priority />
  </div>
</div></div>
          </section>
        </div>

        {/* Slide 2 — Independence Day promo image */}
        <div className="w-full flex-shrink-0">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
            <div className="relative overflow-hidden rounded-3xl border border-gray-200 shadow-sm bg-white">
              <img
                src="/Independance%20Kiddy%20Trnds.png"
                alt="Celebrate Independence Day with Kiddy Trends 14 percent off"
                className="w-full h-[300px] md:h-[460px] object-cover object-center"
              />

              <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={applyLandingDiscount}
                    className="rounded-full bg-[#0f6b4c] text-white font-display text-sm md:text-base px-6 py-2.5 shadow-md hover:opacity-95"
                  >
                    Use code for discount
                  </button>
                  <Link
                    href="/collections?title=independence"
                    className="rounded-full bg-white/95 text-[#0f6b4c] border border-[#0f6b4c]/20 font-display text-sm md:text-base px-6 py-2.5 shadow-md hover:bg-white"
                  >
                    Independence collection
                  </Link>
                </div>
              </div>

              {promoApplied && (
                <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-xl bg-white/95 px-4 py-2 text-xs md:text-sm font-semibold text-[#0f6b4c] shadow-md">
                  14August applied on checkout (14% off)
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-charcoal shadow-md flex items-center justify-center">
        <ChevronIcon direction="left" />
      </button>
      <button type="button" onClick={() => go(index + 1)} aria-label="Next slide"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-charcoal shadow-md flex items-center justify-center">
        <ChevronIcon direction="right" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {[...Array(SLIDE_COUNT)].map((_, i) => (
          <button key={i} type="button" onClick={() => go(i)} aria-label={'Go to slide ' + (i + 1)}
                  className={'h-2.5 rounded-full transition-all ' + (index === i ? 'w-6 bg-coral' : 'w-2.5 bg-gray-300 hover:bg-gray-400')} />
        ))}
      </div>
    </div>
  )
}