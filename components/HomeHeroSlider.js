'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Snowfall from './Snowfall'
import AnimatedLogo from './AnimatedLogo'

const SLIDE_COUNT = 2
const AUTOPLAY_MS = 5000

function ChevronIcon({ direction = 'left' }) {
  const d = direction === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SnowflakeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" strokeLinecap="round" />
    </svg>
  )
}

function TruckIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h11v9H3z" /><path d="M14 11h4l3 3v2h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" />
    </svg>
  )
}

// Illustrated visual for the loyalty slide: a gift-box-on-a-truck icon with a
// gentle floating animation and a couple of sparkle accents.
function FreeShippingIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <style jsx>{`
        .kt-float { animation: kt-float 3.2s ease-in-out infinite; }
        @keyframes kt-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .kt-sparkle { animation: kt-sparkle 2.4s ease-in-out infinite; }
        @keyframes kt-sparkle { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); } }
      `}</style>

      <div className="kt-float">
        <svg width="180" height="150" viewBox="0 0 180 150" fill="none">
          <rect x="10" y="55" width="95" height="60" rx="10" fill="#f5e6c0" />
          <rect x="105" y="72" width="45" height="43" rx="8" fill="#e8635a" />
          <path d="M150 84 L168 84 L168 105 L150 105 Z" fill="#c9a961" />
          <circle cx="45" cy="122" r="12" fill="#0f2438" />
          <circle cx="45" cy="122" r="5" fill="#f5e6c0" />
          <circle cx="128" cy="122" r="12" fill="#0f2438" />
          <circle cx="128" cy="122" r="5" fill="#f5e6c0" />
          <rect x="40" y="40" width="35" height="20" rx="4" fill="#e8635a" />
          <rect x="53" y="30" width="9" height="40" fill="#f5e6c0" />
          <rect x="30" y="47" width="55" height="9" fill="#f5e6c0" />
        </svg>
      </div>

      <svg className="kt-sparkle" width="20" height="20" viewBox="0 0 20 20" style={{ position: 'absolute', top: '18%', right: '20%' }}>
        <path d="M10 0 L12.5 7.5 L20 7.5 L14 12 L16 20 L10 15 L4 20 L6 12 L0 7.5 L7.5 7.5 Z" fill="#f5e6c0" />
      </svg>
      <svg className="kt-sparkle" width="12" height="12" viewBox="0 0 20 20" style={{ position: 'absolute', bottom: '22%', left: '15%', animationDelay: '1.1s' }}>
        <path d="M10 0 L12.5 7.5 L20 7.5 L14 12 L16 20 L10 15 L4 20 L6 12 L0 7.5 L7.5 7.5 Z" fill="#f5e6c0" />
      </svg>
    </div>
  )
}

export default function HomeHeroSlider() {
  const [index, setIndex] = useState(0)
  const paused = useRef(false)

  useEffect(() => {
    const id = setInterval(() => {
      if (!paused.current) setIndex(i => (i + 1) % SLIDE_COUNT)
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [])

  function go(i) { setIndex((i + SLIDE_COUNT) % SLIDE_COUNT) }

  return (
    <div className="relative w-full overflow-hidden"
         onMouseEnter={() => { paused.current = true }}
         onMouseLeave={() => { paused.current = false }}>

      <div className="flex transition-transform duration-700 ease-in-out items-stretch"
           style={{ transform: `translateX(-${index * 100}%)` }}>

        {/* Slide 1 — Winter Arrivals hero */}
        <div className="w-full flex-shrink-0">
          <section
            className="relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #eef5fb 0%, #dbe9f5 100%)' }}
          >
            <Snowfall />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 relative" style={{ zIndex: 3 }}>
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div className="animate-fade-up text-center md:text-left">
                  <span
                    className="inline-flex items-center gap-1.5 font-display text-sm px-4 py-1.5 rounded-full mb-5"
                    style={{ background: '#ffffff', color: '#1f3a52' }}
                  >
                    <SnowflakeIcon /> Winter arrivals available now
                  </span>
                  <h1
                    className="font-display text-5xl md:text-6xl leading-tight mb-6"
                    style={{ color: '#1f3a52' }}
                  >
                    Cozy season,
                    <span className="block">little explorers.</span>
                  </h1>
                  <p className="text-lg leading-relaxed mb-8 max-w-md mx-auto md:mx-0" style={{ color: '#4f6c85' }}>
                    Warm jackets, sweaters and thermals for newborn to 12 years —
                    made to keep them cozy all winter long.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <Link
                      href="/collections?title=winter"
                      className="rounded-full font-display text-sm px-6 py-3"
                      style={{ background: '#1f3a52', color: '#ffffff' }}
                    >
                      Shop winter collection
                    </Link>
                    <Link
                      href="/about"
                      className="rounded-full font-display text-sm px-6 py-3 border-2 bg-transparent"
                      style={{ color: '#1f3a52', borderColor: '#1f3a52' }}
                    >
                      Our story
                    </Link>
                  </div>
                </div>

                <div className="relative flex justify-center px-6">
                  <div
                    className="relative w-full max-w-md rounded-3xl border overflow-hidden flex items-center justify-center p-10"
                    style={{
                      background: 'linear-gradient(160deg, #f4f9fd 0%, #dbe9f5 100%)',
                      borderColor: 'rgba(31,58,82,0.12)',
                    }}
                  >
                    <Snowfall count={18} mobileCount={8} />
                    <div className="relative w-full" style={{ zIndex: 3 }}>
                      <AnimatedLogo />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Slide 2 — Free shipping loyalty perk */}
        <div className="w-full flex-shrink-0">
          <section
            className="relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1f3a52 0%, #0f2438 100%)' }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div className="text-center md:text-left">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 mb-5 text-xs tracking-wide"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#f5e6c0' }}
                  >
                    <TruckIcon className="w-3.5 h-3.5" /> LOYALTY PERK
                  </span>
                  <h2 className="font-display text-4xl md:text-5xl text-white leading-tight mb-4">
                    3 orders. Free shipping<br className="hidden md:block" /> all month.
                  </h2>
                  <p className="text-sm md:text-base mb-8" style={{ color: 'rgba(245,230,192,0.85)' }}>
                    Tracked automatically by your phone number — no code needed.
                  </p>
                  <Link
                    href="/collections"
                    className="inline-block font-display text-sm px-6 py-3 rounded-full"
                    style={{ background: '#f5e6c0', color: '#1f3a52' }}
                  >
                    Start shopping
                  </Link>
                </div>

                <div className="relative flex justify-center px-6">
                  <div
                    className="relative w-full max-w-md rounded-3xl border overflow-hidden flex items-center justify-center p-10 h-64 md:h-80"
                    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(245,230,192,0.2)' }}
                  >
                    <FreeShippingIllustration />
                  </div>
                </div>
              </div>
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