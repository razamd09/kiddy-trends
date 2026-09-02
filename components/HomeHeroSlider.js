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
                    className="relative w-full max-w-md h-64 md:h-80 rounded-3xl border overflow-hidden flex items-center justify-center p-10"
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

        {/* Slide 2 — Landscape summer banner */}
        <div className="w-full flex-shrink-0">
          <section
            className="relative overflow-hidden"
            style={{ background: '#dfeff2' }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
              <Link href="/collections?season=Summer" className="block w-full overflow-hidden rounded-[28px] border border-white/60 shadow-lg bg-white/10">
                <div className="relative w-full aspect-[16/8] sm:aspect-[18/7] md:aspect-[20/7] lg:aspect-[22/7]">
                  <img
                    src="/WhatsApp%20Image%202026-09-02%20at%2010.04.50.jpeg"
                    alt="Summer sale banner"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                </div>
              </Link>
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