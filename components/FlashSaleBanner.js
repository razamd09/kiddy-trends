'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

function getEndTime() {
  // Sale ends at midnight every day — resets daily
  const now = new Date()
  const end = new Date()
  end.setHours(23, 59, 59, 0)
  return end
}

export default function FlashSaleBanner({ rightSideOffsetY = 0 }) {
  const [time, setTime] = useState({ h: '00', m: '00', s: '00' })

  useEffect(() => {
    function tick() {
      const now  = new Date()
      const end  = getEndTime()
      const diff = Math.max(0, end - now)
      const h    = Math.floor(diff / 3600000)
      const m    = Math.floor((diff % 3600000) / 60000)
      const s    = Math.floor((diff % 60000) / 1000)
      setTime({
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
      })
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-charcoal rounded-3xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl animate-bounce2">🔥</span>
        <div>
          <p className="font-display text-white text-lg leading-tight">Flash Sale — Ends Tonight!</p>
          <p className="text-gray-300 text-sm">Up to 50% OFF on kids clothing — Don't miss out!</p>
        </div>
      </div>
      <div
        className="flex items-center gap-3 flex-shrink-0"
        style={{ transform: `translateY(${rightSideOffsetY}px)` }}
      >
        {/* Countdown */}
        <div className="flex items-center gap-1">
          <div className="bg-coral rounded-xl px-3 py-2 text-center min-w-[3rem]">
            <p className="font-display text-2xl text-white leading-none">{time.h}</p>
            <p className="text-white/60 text-xs">HRS</p>
          </div>
          <span className="font-display text-white text-xl">:</span>
          <div className="bg-coral rounded-xl px-3 py-2 text-center min-w-[3rem]">
            <p className="font-display text-2xl text-white leading-none">{time.m}</p>
            <p className="text-white/60 text-xs">MIN</p>
          </div>
          <span className="font-display text-white text-xl">:</span>
          <div className="bg-coral rounded-xl px-3 py-2 text-center min-w-[3rem]">
            <p className="font-display text-2xl text-white leading-none">{time.s}</p>
            <p className="text-white/60 text-xs">SEC</p>
          </div>
        </div>
        <div className="bg-sunny text-charcoal font-display text-sm px-4 py-1.5 rounded-full">
          Flash Sale Now Live!
        </div>
        <Link href="/collections"
          className="bg-coral text-white font-display text-sm px-5 py-2 rounded-full hover:bg-opacity-90 transition-all hover:scale-105">
          Shop Now →
        </Link>
      </div>
    </div>
  )
}