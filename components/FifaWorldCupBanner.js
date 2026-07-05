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
    icons: '⚽ 🏆 🌍',
    leftPlayer: { emoji: '🧒', name: 'Junior Striker', number: '10', shirt: 'bg-[#ef476f]' },
    rightPlayer: { emoji: '👦', name: 'Future Captain', number: '7', shirt: 'bg-[#ffd166]' },
  },
  {
    badge: 'KIDS CLEARANCE SALE',
    title: 'FIFA Fever is Here for Little Champions',
    subtitle: 'Big savings on kids picks inspired by football stars',
    code: 'FIFA26',
    bg: 'from-[#0b3954] via-[#087e8b] to-[#bfd7ea]',
    icons: '🥅 ⚡ 🏟️',
    leftPlayer: { emoji: '👧', name: 'Rising Winger', number: '11', shirt: 'bg-[#06d6a0]' },
    rightPlayer: { emoji: '🧒', name: 'Goal Machine', number: '9', shirt: 'bg-[#118ab2]' },
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
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/25 to-transparent" />

            <div className="absolute left-[8%] top-8 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute right-[10%] bottom-10 w-28 h-28 rounded-full bg-white/10 blur-2xl" />

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

            <div className="hidden md:block absolute left-6 bottom-6 z-10">
              <div className="bg-white/20 backdrop-blur rounded-2xl p-3 w-36 border border-white/30 shadow-lg">
                <div className="text-3xl mb-1">{slide.leftPlayer.emoji}</div>
                <div className={"inline-flex items-center justify-center text-white font-bold text-sm rounded-lg px-2 py-1 mb-2 " + slide.leftPlayer.shirt}>
                  #{slide.leftPlayer.number}
                </div>
                <p className="text-xs font-semibold text-white/95">{slide.leftPlayer.name}</p>
              </div>
            </div>

            <div className="hidden md:block absolute right-6 bottom-6 z-10">
              <div className="bg-white/20 backdrop-blur rounded-2xl p-3 w-36 border border-white/30 shadow-lg">
                <div className="text-3xl mb-1">{slide.rightPlayer.emoji}</div>
                <div className={"inline-flex items-center justify-center text-white font-bold text-sm rounded-lg px-2 py-1 mb-2 " + slide.rightPlayer.shirt}>
                  #{slide.rightPlayer.number}
                </div>
                <p className="text-xs font-semibold text-white/95">{slide.rightPlayer.name}</p>
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
