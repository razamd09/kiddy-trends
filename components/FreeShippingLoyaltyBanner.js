'use client'
import Link from 'next/link'

function StepIcon({ n, active }) {
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center font-display text-sm flex-shrink-0"
      style={{
        background: active ? '#f5e6c0' : 'rgba(255,255,255,0.12)',
        color: active ? '#1f3a52' : '#f5e6c0',
        border: active ? 'none' : '1px solid rgba(245,230,192,0.4)',
      }}
    >
      {n}
    </div>
  )
}

function TruckIcon({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h11v9H3z" /><path d="M14 11h4l3 3v2h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" />
    </svg>
  )
}

export default function FreeShippingLoyaltyBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
      <div
        className="rounded-3xl overflow-hidden p-8 md:p-10"
        style={{ background: 'linear-gradient(135deg, #1f3a52 0%, #0f2438 100%)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-8">

          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
              <TruckIcon className="w-4 h-4" style={{ color: '#f5e6c0' }} />
              <span className="text-xs tracking-wide" style={{ color: '#f5e6c0' }}>LOYALTY PERK</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl text-white mb-3 leading-snug">
              Order 3 times this month,<br className="hidden md:block" /> get free shipping on every order after
            </h2>
            <p className="text-sm" style={{ color: 'rgba(245,230,192,0.85)' }}>
              We track it automatically by your phone number — no code needed. Place your 3rd order this month and every order after that, for the rest of the month, ships free.
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <StepIcon n="1" active />
            <div className="w-4 h-px bg-white/20" />
            <StepIcon n="2" active />
            <div className="w-4 h-px bg-white/20" />
            <StepIcon n="3" active />
            <div className="w-4 h-px bg-white/20" />
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#f5e6c0', color: '#1f3a52' }}
            >
              <TruckIcon className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/collections"
            className="inline-block font-display text-sm px-6 py-2.5 rounded-full"
            style={{ background: '#f5e6c0', color: '#1f3a52' }}
          >
            Start shopping
          </Link>
        </div>
      </div>
    </section>
  )
}