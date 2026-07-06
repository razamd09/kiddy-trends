'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '../context/CartContext'
import SearchBar from './SearchBar'
import RewardsNavChecker from './RewardsNavChecker'

const SPIN_STORAGE_KEY = 'kt_spin_wheel_state'

const links = [
  { href: '/',                label: 'Home' },
  { href: '/collections',     label: 'Collections' },
  { href: '/about',           label: 'About Us' },
  { href: '/refund-policy',   label: 'Refund Policy' },
  { href: '/size-chart',      label: 'Size Chart' },
  { href: '/order-tracking',  label: 'Track Order' },
  { href: '/feedback',        label: '💝 Feedback' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [spinReminder, setSpinReminder] = useState(null)
  const { totalItems, setCartOpen } = useCart()

  useEffect(() => {
    function refreshSpinReminder() {
      try {
        const raw = localStorage.getItem(SPIN_STORAGE_KEY)
        if (!raw) {
          setSpinReminder(null)
          return
        }

        const state = JSON.parse(raw)
        const amount = Number(state?.activeDiscount || 0)
        const consumed = Boolean(state?.consumed)
        const lockedUntil = Number(state?.lockedUntil || 0)
        const code = String(state?.discountCode || '')

        if (amount > 0 && !consumed && lockedUntil > Date.now()) {
          setSpinReminder({ amount, code })
          return
        }

        setSpinReminder(null)
      } catch {
        setSpinReminder(null)
      }
    }

    refreshSpinReminder()
    window.addEventListener('storage', refreshSpinReminder)
    window.addEventListener('focus', refreshSpinReminder)
    window.addEventListener('kt-spin-wheel-updated', refreshSpinReminder)

    return () => {
      window.removeEventListener('storage', refreshSpinReminder)
      window.removeEventListener('focus', refreshSpinReminder)
      window.removeEventListener('kt-spin-wheel-updated', refreshSpinReminder)
    }
  }, [])

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform">
              <Image src="/logo.jpg" alt="Kiddy Trends Logo" width={56} height={56} className="object-cover w-full h-full" />
            </div>
            <span className="font-display text-2xl text-coral hidden sm:block">Kiddy Trends</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link key={link.href} href={link.href}
                className="font-body text-charcoal hover:text-coral px-4 py-2 rounded-full hover:bg-coral/10 transition-all text-sm font-semibold">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <RewardsNavChecker />
            <SearchBar />

            {/* Wishlist */}
            <a href="/wishlist" title="Wishlist"
              className="relative p-2 rounded-full hover:bg-coral/10 transition-colors text-charcoal hover:text-coral">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </a>

            {/* Cart */}
            <div className="relative">
              <button onClick={() => setCartOpen(true)}
              className={'relative p-2 rounded-full hover:bg-coral/10 transition-colors ' + (spinReminder ? 'animate-pulse ring-2 ring-coral/30 ring-offset-2 ring-offset-white' : '')}>
              <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 9H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-coral text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
              </button>

              {spinReminder && (
                <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  className="absolute top-full right-0 mt-2 w-52 rounded-2xl bg-gradient-to-r from-coral to-[#ff8a6f] text-white text-[11px] leading-snug text-left px-3 py-2 shadow-xl animate-bounce z-20"
                >
                  YOU Have PKR {spinReminder.amount} discount, CHECKOUT to avail
                </button>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-full hover:bg-coral/10 transition-colors">
              <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {open
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1">
          {links.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
              className="block font-semibold text-charcoal hover:text-coral hover:bg-coral/10 px-4 py-3 rounded-2xl transition-all">
              {link.label}
            </Link>
          ))}
          <a href="/wishlist" onClick={() => setOpen(false)}
            className="block font-semibold text-charcoal hover:text-coral hover:bg-coral/10 px-4 py-3 rounded-2xl transition-all">
            💝 My Wishlist
          </a>
        </div>
      )}
    </nav>
  )
}