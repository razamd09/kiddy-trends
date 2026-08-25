'use client'
import Link from 'next/link'
import Snowfall from './Snowfall'
import AnimatedLogo from './AnimatedLogo'

function SnowflakeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" strokeLinecap="round" />
    </svg>
  )
}

// Landing hero: single Winter Arrivals hero with a falling-snow effect.
// (Previously a 2-slide carousel with an Independence Day promo slide,
// removed since that offer has ended.)
export default function HomeHeroSlider() {
  return (
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
                href="/collections?season=Winter"
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

          {/* Animated block-logo: tiles build, split apart, and rejoin on a loop */}
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
  )
}