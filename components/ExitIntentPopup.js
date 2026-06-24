'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ExitIntentPopup() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem('exit_popup_seen')
    if (seen) return

    function handleMouseLeave(e) {
      if (e.clientY <= 0) {
        setShow(true)
        sessionStorage.setItem('exit_popup_seen', 'true')
        document.removeEventListener('mouseleave', handleMouseLeave)
      }
    }

    // Mobile — show after 30 seconds of inactivity
    const mobileTimer = setTimeout(() => {
      if (!sessionStorage.getItem('exit_popup_seen')) {
        setShow(true)
        sessionStorage.setItem('exit_popup_seen', 'true')
      }
    }, 30000)

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      clearTimeout(mobileTimer)
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShow(false)} />
      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Close */}
        <button onClick={() => setShow(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center z-10 text-gray-500">
          ✕
        </button>

        {/* Top */}
        <div className="bg-gradient-to-r from-coral to-lavender px-6 pt-8 pb-6 text-center">
          <div className="text-5xl mb-3">🎁</div>
          <h2 className="font-display text-3xl text-white mb-1">Wait! Don't Leave!</h2>
          <p className="text-white/80 text-sm">We have a special gift for you</p>
        </div>

        {/* Body */}
        <div className="px-6 py-6 text-center">
          <div className="bg-sunny/30 rounded-2xl p-4 mb-5">
            <p className="font-display text-4xl text-coral mb-1">10% OFF</p>
            <p className="text-charcoal font-bold text-base">Your Entire Order!</p>
            <div className="mt-3 bg-white border-2 border-dashed border-coral rounded-xl px-4 py-2 inline-block">
              <p className="text-xs text-gray-400 mb-0.5">Use code at checkout</p>
              <p className="font-display text-xl text-coral tracking-widest">KIDDY10</p>
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-5">
            Get <strong>10% off</strong> on kids clothing, bedding, bags & accessories.
            Limited time offer — grab it before it expires!
          </p>

          <Link href="/collections" onClick={() => setShow(false)}
            className="block w-full bg-coral text-white font-display text-lg py-4 rounded-2xl hover:bg-opacity-90 transition-all hover:scale-[1.02] shadow-md mb-3">
            Claim My 10% OFF 🛍️
          </Link>
          <button onClick={() => setShow(false)}
            className="text-gray-400 text-xs hover:text-coral transition-colors">
            No thanks, I'll pay full price
          </button>
        </div>
      </div>
    </div>
  )
}