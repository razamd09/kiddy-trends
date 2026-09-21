'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menus = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  {
    label: 'Product Management',
    items: [
      { href: '/admin/products', label: 'Products' },
      { href: '/admin/product-categories', label: 'Categories' },
      { href: '/admin/product-versions', label: 'Versions' },
      { href: '/admin/product-fabrics', label: 'Fabrics' },
      { href: '/admin/product-types', label: 'Types' },
      { href: '/admin/collections', label: 'Collections' },
    ],
  },
  { label: 'Orders', href: '/admin/orders' },
  {
    label: 'Customers',
    items: [
      { href: '/admin/customers', label: 'Customers' },
      { href: '/admin/rewards', label: 'Rewards' },
      { href: '/admin/feedback', label: 'Feedback' },
    ],
  },
  {
    label: 'Team',
    items: [
      { href: '/admin/employees', label: 'Employees' },
      { href: '/admin/attendance', label: 'Attendance' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/admin/newsletter', label: 'Newsletter' },
      { href: '/admin/discount-codes', label: 'Discount Codes' },
      { href: '/admin/analytics', label: 'Analytics' },
      { href: '/admin/campaigns', label: 'Campaigns' },
      { href: '/admin/whatsapp-broadcast', label: 'WhatsApp Broadcast' },
    ],
  },
  { label: 'Shipping Rates', href: '/admin/shipping-rates' },
]

function isMenuActive(menu, pathname) {
  if (menu.href) return pathname === menu.href || pathname.startsWith(menu.href + '/')
  return menu.items.some((item) => pathname === item.href || pathname.startsWith(item.href + '/'))
}

function MenuDropdown({ menu, pathname }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const active = isMenuActive(menu, pathname)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          'flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ' +
          (active ? 'bg-charcoal text-white' : 'bg-cream text-charcoal hover:bg-coral/10 hover:text-coral')
        }
      >
        {menu.label}
        <span className={'text-xs transition-transform ' + (open ? 'rotate-180' : '')}>▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 min-w-[200px] rounded-2xl border border-gray-100 bg-white p-2 shadow-lg">
          {menu.items.map((item) => {
            const itemActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={
                  'block rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ' +
                  (itemActive ? 'bg-charcoal text-white' : 'text-charcoal hover:bg-coral/10 hover:text-coral')
                }
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminPortalNav() {
  const pathname = usePathname()

  if (pathname === '/admin') return null

  return (
    <div className="z-20 border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/admin/dashboard"
          className="rounded-full bg-coral px-5 py-3 text-base font-display text-white transition-opacity hover:opacity-90"
        >
          ← Back
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {menus.map((menu) =>
            menu.href ? (
              <Link
                key={menu.href}
                href={menu.href}
                className={
                  'rounded-full px-5 py-2.5 text-sm font-bold transition-colors ' +
                  (pathname === menu.href || pathname.startsWith(menu.href + '/')
                    ? 'bg-charcoal text-white'
                    : 'bg-cream text-charcoal hover:bg-coral/10 hover:text-coral')
                }
              >
                {menu.label}
              </Link>
            ) : (
              <MenuDropdown key={menu.label} menu={menu} pathname={pathname} />
            )
          )}
        </div>
      </div>
    </div>
  )
}
