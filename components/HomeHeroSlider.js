'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Snowfall from './Snowfall'
import AnimatedLogo from './AnimatedLogo'

const SLIDE_COUNT = 3
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

function SunIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4L5.6 5.6" />
    </svg>
  )
}

// Illustrated visual for the loyalty slide: a truck drives in from the left
// (with spinning wheels), arrives at a little house, a parcel pops out at
// the door, then the scene fades and loops.
function FreeShippingIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <style jsx>{`
        .kt-truck-group { animation: kt-truck-drive 6s ease-in-out infinite; }
        @keyframes kt-truck-drive {
          0%   { transform: translateX(-110px); opacity: 1; }
          45%  { transform: translateX(0px); opacity: 1; }
          65%  { transform: translateX(0px); opacity: 1; }
          75%  { transform: translateX(0px); opacity: 0; }
          76%  { transform: translateX(-110px); opacity: 0; }
          100% { transform: translateX(-110px); opacity: 1; }
        }
        .kt-wheel { animation: kt-wheel-spin 0.7s linear infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes kt-wheel-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .kt-parcel { animation: kt-parcel-pop 6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes kt-parcel-pop {
          0%, 48% { opacity: 0; transform: translateY(6px) scale(0.7); }
          56%     { opacity: 1; transform: translateY(-4px) scale(1.05); }
          64%     { opacity: 1; transform: translateY(0px) scale(1); }
          75%     { opacity: 1; transform: translateY(0px) scale(1); }
          80%, 100% { opacity: 0; transform: translateY(6px) scale(0.7); }
        }

        .kt-sparkle { animation: kt-sparkle 2.4s ease-in-out infinite; }
        @keyframes kt-sparkle { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); } }
      `}</style>

      <svg width="260" height="160" viewBox="0 0 260 160" fill="none">
        <line x1="20" y1="140" x2="240" y2="140" stroke="#1f3a52" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="6 6" />
        <g>
          <rect x="185" y="90" width="55" height="50" rx="4" fill="#ffffff" />
          <path d="M178 92 L212 62 L247 92 Z" fill="#e8635a" />
          <rect x="203" y="112" width="18" height="28" rx="2" fill="#1f3a52" />
          <rect x="222" y="100" width="10" height="10" rx="1" fill="#1f3a52" fillOpacity="0.35" />
        </g>
        <g className="kt-parcel">
          <rect x="196" y="118" width="16" height="16" rx="2" fill="#e8635a" />
          <line x1="196" y1="126" x2="212" y2="126" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="204" y1="118" x2="204" y2="134" stroke="#ffffff" strokeWidth="1.5" />
        </g>
        <g className="kt-truck-group">
          <rect x="10" y="65" width="90" height="55" rx="9" fill="#f5e6c0" />
          <rect x="100" y="80" width="42" height="40" rx="7" fill="#e8635a" />
          <path d="M142 92 L159 92 L159 112 L142 112 Z" fill="#c9a961" />
          <circle className="kt-wheel" cx="40" cy="127" r="11" fill="#1f3a52" />
          <circle cx="40" cy="127" r="4.5" fill="#f5e6c0" />
          <circle className="kt-wheel" cx="120" cy="127" r="11" fill="#1f3a52" />
          <circle cx="120" cy="127" r="4.5" fill="#f5e6c0" />
        </g>
      </svg>

      <svg className="kt-sparkle" width="18" height="18" viewBox="0 0 20 20" style={{ position: 'absolute', top: '14%', right: '12%' }}>
        <path d="M10 0 L12.5 7.5 L20 7.5 L14 12 L16 20 L10 15 L4 20 L6 12 L0 7.5 L7.5 7.5 Z" fill="#c9a961" />
      </svg>
      <svg className="kt-sparkle" width="11" height="11" viewBox="0 0 20 20" style={{ position: 'absolute', top: '20%', left: '10%', animationDelay: '1.1s' }}>
        <path d="M10 0 L12.5 7.5 L20 7.5 L14 12 L16 20 L10 15 L4 20 L6 12 L0 7.5 L7.5 7.5 Z" fill="#c9a961" />
      </svg>
    </div>
  )
}

// Illustrated visual for the summer slide: a big teddy bear sitting in the
// grass, holding up a "FREE DC" sign. The bear bobs gently, the head tilts,
// and the sign sways in the breeze while little suns twinkle overhead.
function BigBearIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <style jsx>{`
        .kt-bear-group { animation: kt-bear-bounce 3s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
        @keyframes kt-bear-bounce {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-6px); }
        }

        .kt-bear-head { animation: kt-bear-tilt 4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
        @keyframes kt-bear-tilt {
          0%, 100% { transform: rotate(-3deg); }
          50%      { transform: rotate(3deg); }
        }

        .kt-sign { animation: kt-sign-sway 3.5s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
        @keyframes kt-sign-sway {
          0%, 100% { transform: rotate(-2deg); }
          50%      { transform: rotate(2deg); }
        }

        .kt-sun-sparkle { animation: kt-sun-twinkle 2.4s ease-in-out infinite; }
        @keyframes kt-sun-twinkle { 0%,100% { opacity: 0.35; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.1); } }
      `}</style>

      <svg width="260" height="200" viewBox="0 0 260 200" fill="none">
        <line x1="20" y1="180" x2="240" y2="180" stroke="#1f3a52" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="6 6" />

        <g className="kt-bear-group">
          {/* feet */}
          <ellipse cx="103" cy="177" rx="22" ry="13" fill="#c9a961" />
          <ellipse cx="157" cy="177" rx="22" ry="13" fill="#c9a961" />
          <ellipse cx="103" cy="180" rx="11" ry="6" fill="#f5e6c0" />
          <ellipse cx="157" cy="180" rx="11" ry="6" fill="#f5e6c0" />

          {/* body */}
          <rect x="72" y="96" width="116" height="88" rx="46" fill="#c9a961" />

          {/* arms */}
          <ellipse cx="86" cy="133" rx="16" ry="27" fill="#c9a961" transform="rotate(18 86 133)" />
          <ellipse cx="174" cy="133" rx="16" ry="27" fill="#c9a961" transform="rotate(-18 174 133)" />

          {/* sign */}
          <g className="kt-sign">
            <rect x="87" y="117" width="86" height="46" rx="6" fill="#ffffff" stroke="#1f3a52" strokeOpacity="0.15" strokeWidth="2" />
            <text x="130" y="147" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="17" fill="#e8635a">FREE DC</text>
          </g>

          {/* paws holding the sign */}
          <circle cx="90" cy="159" r="13" fill="#c9a961" />
          <circle cx="170" cy="159" r="13" fill="#c9a961" />

          {/* head */}
          <g className="kt-bear-head">
            <circle cx="99" cy="32" r="15" fill="#c9a961" />
            <circle cx="161" cy="32" r="15" fill="#c9a961" />
            <circle cx="99" cy="32" r="7" fill="#f5e6c0" />
            <circle cx="161" cy="32" r="7" fill="#f5e6c0" />
            <circle cx="130" cy="62" r="40" fill="#c9a961" />
            <ellipse cx="130" cy="72" rx="20" ry="15" fill="#f5e6c0" />
            <circle cx="115" cy="55" r="4" fill="#1f3a52" />
            <circle cx="145" cy="55" r="4" fill="#1f3a52" />
            <ellipse cx="130" cy="66" rx="5" ry="4" fill="#1f3a52" />
            <path d="M130 70 Q130 76 122 78 M130 70 Q130 76 138 78" stroke="#1f3a52" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        </g>
      </svg>

      <svg className="kt-sun-sparkle" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e8b93a" strokeWidth="1.8" strokeLinecap="round" style={{ position: 'absolute', top: '10%', right: '14%' }}>
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4L5.6 5.6" />
      </svg>
      <svg className="kt-sun-sparkle" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e8635a" strokeWidth="1.8" strokeLinecap="round" style={{ position: 'absolute', top: '18%', left: '10%', animationDelay: '1.1s' }}>
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4L5.6 5.6" />
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

        {/* Slide 2 — Free shipping loyalty perk */}
        <div className="w-full flex-shrink-0">
          <section
            className="relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #eef5fb 0%, #dbe9f5 100%)' }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div className="text-center md:text-left">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 mb-5 text-xs tracking-wide"
                    style={{ background: '#ffffff', color: '#1f3a52' }}
                  >
                    <TruckIcon className="w-3.5 h-3.5" /> LOYALTY PERK
                  </span>
                  <h2 className="font-display text-4xl md:text-5xl leading-tight mb-4" style={{ color: '#1f3a52' }}>
                    3 orders. Free shipping<br className="hidden md:block" /> all month.
                  </h2>
                  <Link
                    href="/collections"
                    className="inline-block font-display text-sm px-6 py-3 rounded-full"
                    style={{ background: '#1f3a52', color: '#ffffff' }}
                  >
                    Start shopping
                  </Link>
                </div>

                <div className="relative flex justify-center px-6">
                  <div
                    className="relative w-full max-w-md h-64 md:h-80 rounded-3xl border overflow-hidden flex items-center justify-center p-10"
                    style={{ background: 'linear-gradient(160deg, #f4f9fd 0%, #dbe9f5 100%)', borderColor: 'rgba(31,58,82,0.12)' }}
                  >
                    <FreeShippingIllustration />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Slide 3 — Summer articles + Free DC promo, Big Bear */}
        <div className="w-full flex-shrink-0">
          <section
            className="relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #eef5fb 0%, #dbe9f5 100%)' }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div className="text-center md:text-left">
                  <span
                    className="inline-flex items-center gap-1.5 font-display text-sm px-4 py-1.5 rounded-full mb-5"
                    style={{ background: '#ffffff', color: '#1f3a52' }}
                  >
                    <SunIcon className="w-3.5 h-3.5" /> Summer collection available now
                  </span>
                  <h2
                    className="font-display text-4xl md:text-5xl leading-tight mb-6"
                    style={{ color: '#1f3a52' }}
                  >
                    Order summer
                    <span className="block">articles and get</span>
                    <span className="block" style={{ color: '#e8635a' }}>FREE DC</span>
                  </h2>
                  <p className="text-lg leading-relaxed mb-8 max-w-md mx-auto md:mx-0" style={{ color: '#4f6c85' }}>
                    Refresh their wardrobe with the coolest styles of the season!
                    Offer valid on all summer collections.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <Link
                      href="/collections?title=summer"
                      className="inline-flex items-center gap-2 rounded-full font-display text-sm px-6 py-3"
                      style={{ background: '#1f3a52', color: '#ffffff' }}
                    >
                      SHOP NOW <ChevronIcon direction="right" />
                    </Link>
                  </div>
                </div>

                <div className="relative flex justify-center px-6">
                  <div
                    className="relative w-full max-w-md h-64 md:h-80 rounded-3xl border overflow-hidden flex items-center justify-center p-10"
                    style={{ background: 'linear-gradient(160deg, #f4f9fd 0%, #dbe9f5 100%)', borderColor: 'rgba(31,58,82,0.12)' }}
                  >
                    <BigBearIllustration />
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