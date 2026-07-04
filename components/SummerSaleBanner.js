'use client'
import Image from 'next/image'
import { useState, useEffect, useMemo } from 'react'

export default function SummerSaleBanner({
  discountCode: initialCode = 'SUMMER50',
  href = '/collections',
  images = ['/sale-slide-1.jpg', '/sale-slide-2.jpg'],
  autoSlideMs = 4500,
}) {
  const [code, setCode] = useState(initialCode)
  const slides = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images])
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [touchStartX, setTouchStartX] = useState(null)

  useEffect(() => {
    setActive(0)
  }, [slides.length])

  useEffect(() => {
    if (slides.length < 2 || paused) return
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length)
    }, autoSlideMs)
    return () => clearInterval(id)
  }, [slides.length, paused, autoSlideMs])

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

  function goTo(index) {
    if (slides.length === 0) return
    const normalized = ((index % slides.length) + slides.length) % slides.length
    setActive(normalized)
  }

  function handleTouchStart(e) {
    setTouchStartX(e.touches?.[0]?.clientX ?? null)
  }

  function handleTouchEnd(e) {
    if (touchStartX == null || slides.length < 2) return
    const endX = e.changedTouches?.[0]?.clientX ?? touchStartX
    const diff = touchStartX - endX
    if (Math.abs(diff) < 40) return
    if (diff > 0) goTo(active + 1)
    else goTo(active - 1)
    setTouchStartX(null)
  }

  return (
    <section
      role="region"
      aria-label="Summer sale slideshow"
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-[260px] sm:h-[320px] md:h-[420px] w-full bg-skyblue/30">
        {slides.length > 0 ? (
          <>
            {slides.map((src, idx) => (
              <div
                key={src + idx}
                className={
                  'absolute inset-0 transition-opacity duration-700 ' +
                  (idx === active ? 'opacity-100' : 'opacity-0')
                }
                aria-hidden={idx !== active}
              >
                <Image
                  src={src}
                  alt={'Summer sale slide ' + (idx + 1)}
                  fill
                  priority={idx === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-skyblue/70 to-sunny/60">
            <p className="font-display text-2xl text-charcoal">Add 2 banner images in /public</p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/35 via-charcoal/15 to-charcoal/30" />

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold shadow-md md:text-sm">
            <span className="h-2 w-2 rounded-full bg-white" style={{ animation: 'kt-live-blink 1s steps(1) infinite' }} />
            SALE IS LIVE
          </div>
          <h2 className="mt-3 font-display text-3xl leading-tight drop-shadow md:text-6xl">
            Summer Sale is LIVE
          </h2>
          <p className="mt-1 text-base font-bold drop-shadow md:text-2xl">
            on Kiddy Trends - Up to 50% OFF
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/25 px-3 py-2 text-sm backdrop-blur md:text-base">
              <span>Use code</span>
              <span className="rounded-lg bg-white px-3 py-1 font-bold tracking-wider text-charcoal">{code}</span>
            </div>
            <a
              href={href}
              className="inline-flex items-center justify-center rounded-full bg-coral px-7 py-3 font-display text-base text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:text-lg"
              aria-label="Shop the summer sale"
            >
              Shop the Sale
            </a>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              className="absolute left-3 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full bg-white/85 text-xl font-bold text-charcoal shadow hover:bg-white"
              aria-label="Previous slide"
            >
              {'<'}
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              className="absolute right-3 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full bg-white/85 text-xl font-bold text-charcoal shadow hover:bg-white"
              aria-label="Next slide"
            >
              {'>'}
            </button>

            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goTo(idx)}
                  className={
                    'h-2.5 rounded-full transition-all ' +
                    (idx === active ? 'w-7 bg-white' : 'w-2.5 bg-white/65')
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
