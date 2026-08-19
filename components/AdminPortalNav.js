'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const moduleLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/collections', label: 'Collections' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/employees', label: 'Employees' },
  { href: '/admin/attendance', label: 'Attendance' },
  { href: '/admin/rewards', label: 'Rewards' },
  { href: '/admin/discount-codes', label: 'Discount Codes' },
  { href: '/admin/shipping-rates', label: 'Shipping Rates' },
  { href: '/admin/feedback', label: 'Feedback' },
]

export default function AdminPortalNav() {
  const pathname = usePathname()

  if (pathname === '/admin') return null

  return (
    <div className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/admin/dashboard"
          className="rounded-full bg-coral px-4 py-2 text-sm font-display text-white transition-opacity hover:opacity-90"
        >
          ← Back
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {moduleLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ' +
                  (active
                    ? 'bg-charcoal text-white'
                    : 'bg-cream text-charcoal hover:bg-coral/10 hover:text-coral')
                }
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
