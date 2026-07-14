'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const SLIDE_COUNT = 2
const AUTOPLAY_MS = 4000

// Landing hero carousel: slide 1 = Kiddy Trends brand block, slide 2 =
// Independence Day offer image. Auto-rotates and pauses on hover.
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

      {/* Track */}
      <div className="flex transition-transform duration-700 ease-in-out items-stretch"
           style={{ transform: `translateX(-${index * 100}%)` }}>

        {/* Slide 1 — Kiddy Trends brand block */}
        <div className="w-full flex-shrink-0">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 h-full">
            <div className="grid md:grid-cols-2 gap-10 items-center h-full">
              <div className="animate-fade-up">
                <span className="inline-block bg-sunny text-charcoal font-display text-sm px-4 py-1.5 rounded-full mb-5">
                  Newborn — 12 Years 🎉
                </span>
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-charcoal leading-tight mb-6">
                  Dress them
                  <span className="text-coral block">to impress.</span>
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-md">
                  Kiddy Trends brings you the cutest, comfiest clothes, bedding, bags
                  and accessories for little explorers. Because every day is a fashion adventure!
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/collections" className="btn-primary">Shop Now 🛍️</Link>
                  <Link href="/about" className="btn-outline">Our Story</Link>
                </div>
              </div>
              <div className="relative flex justify-center px-12">
                <div className="w-72 h-72 md:w-96 md:h-96 bg-skyblue/30 rounded-[60%_40%_55%_45%/50%_60%_40%_50%] flex items-center justify-center animate-float">
                  <Image src="/logo.jpg" alt="Kiddy Trends" width={260} height={260} className="rounded-3xl shadow-2xl object-cover" />
                </div>
                <div className="absolute -top-4 right-0 bg-white rounded-2xl px-3 py-1.5 shadow-lg animate-bounce2 font-display text-coral text-xs whitespace-nowrap" style={{animationDelay:'0s'}}>😍 Super Soft!</div>
                <div className="absolute top-6 -left-8 bg-mint rounded-2xl px-3 py-1.5 shadow-lg font-display text-charcoal text-xs animate-float whitespace-nowrap" style={{animationDelay:'0.7s'}}>👩 Mom's First Choice</div>
                <div className="absolute top-1/3 -right-6 bg-coral rounded-2xl px-3 py-1.5 shadow-lg font-display text-white text-xs animate-bounce2 whitespace-nowrap" style={{animationDelay:'1.2s'}}>💰 Dad's Pocket Friendly</div>
                <div className="absolute top-1/2 -left-4 bg-skyblue rounded-2xl px-3 py-1.5 shadow-lg font-display text-charcoal text-xs animate-float whitespace-nowrap" style={{animationDelay:'1.8s'}}>🏆 Premium</div>
                <div className="absolute -bottom-2 right-8 bg-lavender rounded-2xl px-3 py-1.5 shadow-lg font-display text-white text-xs animate-bounce2 whitespace-nowrap" style={{animationDelay:'2.2s'}}>⭐ Branded</div>
                <div className="absolute bottom-10 -left-6 bg-sunny rounded-2xl px-3 py-1.5 shadow-lg font-display text-charcoal text-xs animate-float whitespace-nowrap" style={{animationDelay:'0.4s'}}>✨ 100% Safe</div>
              </div>
            </div>
          </section>
        </div>

        {/* Slide 2 — Independence Day promo image */}
        <div className="w-full flex-shrink-0">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 shadow-[0_24px_70px_rgba(20,60,40,0.16)] bg-white">
              <img
                src="/sale-slide-2.jpg"
                alt="Celebrate Independence Day with Kiddy Trends 14 percent off"
                className="w-full h-[300px] md:h-[460px] object-cover"
              />
            </div>
          </section>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-charcoal shadow-md flex items-center justify-center text-2xl leading-none">
        ‹
      </button>
      <button type="button" onClick={() => go(index + 1)} aria-label="Next slide"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-charcoal shadow-md flex items-center justify-center text-2xl leading-none">
        ›
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
