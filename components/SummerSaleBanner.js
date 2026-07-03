'use client'
import { useState, useEffect } from 'react'

// Animated summer beach "clip" banner — a looping CSS/SVG scene (sun, waves,
// swaying palms, bobbing kids & beach props) announcing the live sale.
export default function SummerSaleBanner({ discountCode: initialCode = 'SUMMER50', href = '/collections' }) {
  const [code, setCode] = useState(initialCode)

  useEffect(() => {
    let mounted = true
    async function fetchCodes() {
      try {
        const res = await fetch('/api/discount-codes')
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        if (Array.isArray(data.codes) && data.codes.length > 0) {
          const active = data.codes.find(c => c.enabled) || data.codes[0]
          if (active && active.code) setCode(active.code)
        }
      } catch (err) {
        console.error('Error fetching discount codes:', err)
      }
    }
    fetchCodes()
    return () => { mounted = false }
  }, [])

  return (
    <section role="region" aria-label="Summer sale — live now"
      className="relative w-full overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#7ed0ff 0%,#bfe9ff 45%,#ffe9b8 70%,#ffd98a 100%)' }}>

      {/* ---- Sky layer ---- */}
      {/* Sun with rotating rays */}
      <div className="absolute left-6 top-5 md:left-16 md:top-6 w-20 h-20 md:w-28 md:h-28 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 rounded-full"
             style={{ background: 'radial-gradient(circle,#fff6c9 0%,#ffd54a 60%,#ffb300 100%)', animation: 'kt-sun-pulse 3.5s ease-in-out infinite' }} />
        <div className="absolute inset-[-14px]" style={{ animation: 'kt-sun-rays 22s linear infinite' }}>
          {[...Array(12)].map((_, i) => (
            <span key={i} className="absolute left-1/2 top-1/2 origin-bottom"
              style={{
                width: '3px', height: '14px', marginLeft: '-1.5px',
                background: 'rgba(255,213,74,0.85)', borderRadius: '2px',
                transform: `rotate(${i * 30}deg) translateY(-46px)`,
              }} />
          ))}
        </div>
      </div>

      {/* Drifting clouds */}
      <div className="absolute top-6 left-0 w-full h-16 pointer-events-none" aria-hidden>
        <span className="absolute top-2 text-3xl md:text-4xl opacity-90" style={{ animation: 'kt-cloud-drift 26s linear infinite' }}>☁️</span>
        <span className="absolute top-6 text-2xl md:text-3xl opacity-80" style={{ animation: 'kt-cloud-drift 38s linear infinite', animationDelay: '6s' }}>☁️</span>
      </div>

      {/* ---- Content ---- */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 pt-10 pb-24 md:pt-14 md:pb-28 flex flex-col items-center text-center">

        {/* LIVE pill */}
        <div className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs md:text-sm font-bold shadow-md"
             style={{ animation: 'kt-pop-in 0.6s ease-out' }}>
          <span className="w-2 h-2 rounded-full bg-white" style={{ animation: 'kt-live-blink 1s steps(1) infinite' }} />
          SALE IS LIVE
        </div>

        {/* Announced headline with shimmer */}
        <h2 className="mt-3 font-display text-4xl md:text-6xl leading-tight text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.15)]"
            style={{ animation: 'kt-pop-in 0.7s ease-out' }}>
          <span className="inline-block" style={{ animation: 'kt-bob-slow 3s ease-in-out infinite' }}>☀️</span>{' '}
          Summer Sale is{' '}
          <span className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: 'linear-gradient(90deg,#fff 0%,#ffe9a8 25%,#fff 50%,#ffd54a 75%,#fff 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'kt-shimmer 2.5s linear infinite',
                }}>LIVE</span>
        </h2>
        <p className="mt-1 text-lg md:text-2xl text-white font-bold drop-shadow-[0_2px_0_rgba(0,0,0,0.12)]">
          on Kiddy Trends — Up to <span className="font-black">50% OFF</span> 🏖️
        </p>

        {/* Bobbing beach cast — kids enjoying summer */}
        <div className="mt-3 flex items-end justify-center gap-3 md:gap-5 text-3xl md:text-5xl" aria-hidden>
          {['🏄', '🧒', '🏖️', '👧', '🏐', '🩴'].map((e, i) => (
            <span key={i} className="inline-block"
                  style={{ animation: `kt-float-bob ${2.6 + i * 0.25}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}>
              {e}
            </span>
          ))}
        </div>

        {/* Code + CTA */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 bg-white/25 backdrop-blur px-3 py-2 rounded-xl text-white text-sm md:text-base">
            <span>Use code</span>
            <span className="bg-white text-charcoal px-3 py-1 rounded-lg font-bold tracking-wider">{code}</span>
          </div>
          <a href={href}
             className="inline-flex items-center justify-center bg-coral text-white font-display text-base md:text-lg px-7 py-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
             style={{ animation: 'kt-bob-slow 2.8s ease-in-out infinite' }}
             aria-label="Shop the summer sale">
            🛍️ Shop the Sale
          </a>
        </div>
      </div>

      {/* ---- Palm trees ---- */}
      <div className="absolute bottom-14 left-3 md:left-10 text-5xl md:text-7xl z-10 origin-bottom pointer-events-none" aria-hidden
           style={{ animation: 'kt-palm-sway 4s ease-in-out infinite' }}>🌴</div>
      <div className="absolute bottom-14 right-3 md:right-10 text-5xl md:text-7xl z-10 origin-bottom pointer-events-none -scale-x-100" aria-hidden
           style={{ animation: 'kt-palm-sway 4.6s ease-in-out infinite', animationDelay: '0.5s' }}>🌴</div>

      {/* ---- Sea + sand at the bottom ---- */}
      <div className="absolute bottom-0 left-0 w-full h-20 md:h-24 z-0 pointer-events-none" aria-hidden>
        {/* Animated waves (double-width strip scrolling for a seamless loop) */}
        <div className="absolute bottom-8 md:bottom-10 left-0 h-10 md:h-12" style={{ width: '200%', animation: 'kt-wave-drift 7s linear infinite' }}>
          <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,30 C150,55 300,5 600,30 C900,55 1050,5 1200,30 L1200,60 L0,60 Z" fill="#38bdf8" opacity="0.9" />
          </svg>
        </div>
        <div className="absolute bottom-9 md:bottom-11 left-0 h-9 md:h-11" style={{ width: '200%', animation: 'kt-wave-drift 5s linear infinite reverse' }}>
          <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,30 C150,55 300,5 600,30 C900,55 1050,5 1200,30 L1200,60 L0,60 Z" fill="#0ea5e9" opacity="0.55" />
          </svg>
        </div>
        {/* Sand */}
        <div className="absolute bottom-0 left-0 w-full h-9 md:h-10" style={{ background: 'linear-gradient(180deg,#ffe6a8 0%,#f4d18a 100%)' }} />
      </div>
    </section>
  )
}
