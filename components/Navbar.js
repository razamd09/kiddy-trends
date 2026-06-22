'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const links = [
  { href: '/',               label: 'Home' },
  { href: '/collections',    label: 'Collections' },
  { href: '/about',          label: 'About Us' },
  { href: '/refund-policy',  label: 'Refund Policy' },
  { href: '/size-chart',     label: 'Size Chart' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform">
              <Image
                src="/logo.jpg"
                alt="Kiddy Trends Logo"
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="font-display text-2xl text-coral hidden sm:block">
              Kiddy Trends
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body font-700 text-charcoal hover:text-coral px-4 py-2 rounded-full hover:bg-coral/10 transition-all text-sm font-semibold"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Cart + mobile toggle */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-full hover:bg-coral/10 transition-colors">
              <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 9H4L5 9z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-coral text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">0</span>
            </button>

            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-full hover:bg-coral/10 transition-colors"
            >
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
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block font-semibold text-charcoal hover:text-coral hover:bg-coral/10 px-4 py-3 rounded-2xl transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
