'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '../context/CartContext'
import SearchBar from './SearchBar'
import RewardsNavChecker from './RewardsNavChecker'

const links = [
  { href: '/',                label: 'Home' },
  { href: '/collections',     label: 'Collections' },
  { href: '/about',           label: 'About Us' },
  { href: '/refund-policy',   label: 'Refund Policy' },
  { href: '/size-chart',      label: 'Size Chart' },
  { href: '/order-tracking',  label: 'Track Order' },
  { href: '/feedback',        label: '💝 Feedback' },
]

const menuLinks = [
  { href: '/collections?title=winter', label: 'Winter Arrivals 2026' },
  { href: '/collections?genders=Boys', label: 'Boys' },
  { href: '/collections?genders=Girls', label: 'Girls' },
  { href: '/collections?cat=newborn', label: 'Infants' },
  { href: '/collections?cat=accessories', label: 'Accessories' },
  { href: '/collections?cat=bedding', label: 'Bedding' },
  { href: '/collections?title=summer', label: 'Summer Clearance Sale' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { totalItems, setCartOpen } = useCart()

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo + Menu */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                <Image src="/logo.jpg" alt="Kiddy Trends Logo" width={56} height={56} className="object-cover w-full h-full" />
              </div>
              <span className="font-display text-2xl text-coral hidden sm:block">Kiddy Trends</span>
            </Link>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-coral to-orange-400 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all text-sm font-display"
                aria-label="Toggle menu"
              >
                <span aria-hidden="true">✨</span>
                <span className="hidden sm:inline">Explore Now</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 z-50">
                  {menuLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block font-semibold text-charcoal hover:text-coral hover:bg-coral/10 px-4 py-3 rounded-xl transition-all"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

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
              className={'relative p-2 rounded-full hover:bg-coral/10 transition-colors'}>
              <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 9H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-coral text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
              </button>
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
          {menuLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
              className="block font-semibold text-charcoal hover:text-coral hover:bg-coral/10 px-4 py-3 rounded-2xl transition-all">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}