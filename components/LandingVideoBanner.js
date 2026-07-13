'use client'

import Link from 'next/link'

const VIDEO_SRC = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

export default function LandingVideoBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-cream to-sunny/25 shadow-[0_24px_80px_rgba(60,40,20,0.14)]">
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-coral/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-10 h-52 w-52 rounded-full bg-skyblue/20 blur-3xl" />

        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] items-center p-6 md:p-8 lg:p-10">
          <div className="relative z-10 animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-coral/20 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-coral shadow-sm">
              ✨ New Season Drop
            </span>
            <h2 className="mt-4 font-display text-3xl md:text-5xl lg:text-6xl leading-tight text-charcoal">
              Fresh styles, playful motion, and kid-friendly picks.
            </h2>
            <p className="mt-3 max-w-xl text-base md:text-lg text-gray-600 leading-relaxed">
              Explore the latest arrivals with a quick animated preview. Tap through to see what’s new for girls and boys, from everyday wear to special outfits.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/collections" className="btn-primary">
                Explore Collection 🎯
              </Link>
              <Link href="/collections?cat=all" className="btn-outline">
                View All Products
              </Link>
            </div>
          </div>

          <div className="relative z-10">
            <div className="relative overflow-hidden rounded-[1.75rem] border-4 border-white/90 bg-charcoal shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-charcoal/40 via-transparent to-white/10 z-10" />
              <video
                className="h-[260px] w-full object-cover md:h-[340px]"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster="/sale-slide-1.jpg"
              >
                <source src={VIDEO_SRC} type="video/mp4" />
                <img src="/sale-slide-1.jpg" alt="Kiddy Trends new arrivals banner" className="h-[260px] w-full object-cover md:h-[340px]" />
              </video>

              <div className="absolute left-4 top-4 z-20 rounded-2xl bg-white/90 px-3 py-1.5 text-xs font-bold text-charcoal shadow-md">
                Tap to shop
              </div>
              <div className="absolute right-4 bottom-4 z-20 rounded-2xl bg-coral px-3 py-1.5 text-xs font-bold text-white shadow-md animate-bounce2">
                New arrivals are live
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-semibold">Trend preview</p>
                <p className="font-display text-sm text-charcoal">Animated banner with product motion</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}