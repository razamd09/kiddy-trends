'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const SLIDES = [
  {
    badge: 'FIFA WORLD CUP 2026',
    title: 'Unlock the Magic of FIFA World Cup 2026',
    subtitle: 'With FIFA players showing kids clearance sale',
    code: 'FIFA26',
    bg: 'from-[#0d3b66] via-[#145da0] to-[#1f8a70]',
    icons: '⚽ 🏆 👦 👧',
  },
  {
    badge: 'KIDS CLEARANCE SALE',
    title: 'FIFA Fever is Here for Little Champions',
    subtitle: 'Big savings on kids picks inspired by football stars',
    code: 'FIFA26',
    bg: 'from-[#0b3954] via-[#087e8b] to-[#bfd7ea]',
    icons: '🥅 ⚡ 🧢 👟',
  },
]

export default function FifaWorldCupBanner({ href = '/collections', autoMs = 4500 }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (SLIDES.length < 2) return
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length)
    }, autoMs)
    return () => clearInterval(id)
  }, [autoMs])

  function goTo(index) {
    const total = SLIDES.length
    setActive(((index % total) + total) % total)
  }

  return (
    <section className="relative w-full overflow-hidden" aria-label="FIFA World Cup 2026 banner slider">
      <div className="relative h-[220px] md:h-[280px] w-full">
        {SLIDES.map((slide, idx) => (
          <div
            key={slide.title}
            className={
              'absolute inset-0 transition-opacity duration-700 bg-gradient-to-r ' +
              slide.bg +
              ' ' +
              (idx === active ? 'opacity-100' : 'opacity-0')
            }
            aria-hidden={idx !== active}
          >
            <div className="absolute inset-0 bg-black/15" />
            <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center text-white">
              <span className="inline-block bg-white/20 border border-white/40 rounded-full px-3 py-1 text-xs md:text-sm font-bold">
                {slide.badge}
              </span>
              <h2 className="mt-2 font-display text-2xl md:text-5xl leading-tight drop-shadow">
                {slide.title}
              </h2>
              <p className="mt-1 text-sm md:text-xl font-semibold drop-shadow">
                {slide.subtitle}
              </p>
              <p className="mt-2 text-xl md:text-3xl">{slide.icons}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                <div className="inline-flex items-center gap-2 bg-white/25 backdrop-blur px-3 py-2 rounded-xl text-white text-sm md:text-base">
                  <span>Sale code:</span>
                  <span className="bg-white text-charcoal px-3 py-1 rounded-lg font-bold tracking-wider">{slide.code}</span>
                </div>
                <Link
                  href={href}
                  className="inline-flex items-center justify-center bg-coral text-white font-display text-sm md:text-base px-6 py-2.5 rounded-full shadow-lg hover:scale-105 transition-transform"
                >
                  Shop Clearance
                </Link>
              </div>
            </div>
          </div>
        ))}

        {SLIDES.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              className="absolute left-3 top-1/2 z-20 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-charcoal font-bold text-lg shadow hover:bg-white"
              aria-label="Previous slide"
            >
              {'<'}
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-charcoal font-bold text-lg shadow hover:bg-white"
              aria-label="Next slide"
            >
              {'>'}
            </button>

            <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goTo(idx)}
                  className={
                    'h-2.5 rounded-full transition-all ' +
                    (idx === active ? 'w-7 bg-white' : 'w-2.5 bg-white/70')
                  }
                  aria-label={'Go to slide ' + (idx + 1)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
