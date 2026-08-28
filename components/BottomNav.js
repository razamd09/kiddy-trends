'use client'
import Link from 'next/link'
import { useCart } from '../context/CartContext'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

function NavIcon({ name }) {
    const common = { className: 'w-5 h-5', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
    const paths = {
        home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
        shop: <><path d="M4 7h16l-1 13H5L4 7Z" /><path d="m8 7 1-4h6l1 4" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></>,
        wishlist: <path d="M20.8 8.8c0 5.5-8.8 10.2-8.8 10.2S3.2 14.3 3.2 8.8A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.4Z" />,
        feedback: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-3.5-.8L4 20l1.2-3.7A7.3 7.3 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="m12 7 .8 2.2 2.2.8-2.2.8L12 13l-.8-2.2-2.2-.8 2.2-.8L12 7Z" /></>,
        cart: <><path d="M3 4h2l2 12h10l2-8H6" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></>,
    }
    return <svg {...common}>{paths[name]}</svg>
}

export default function BottomNav() {
    const { totalItems, setCartOpen } = useCart()
    const pathname = usePathname()
    const [cartBump, setCartBump] = useState(false)

    useEffect(() => {
        function handleCartItemAdded() {
            setCartBump(false)
            requestAnimationFrame(() => setCartBump(true))
        }

        window.addEventListener('kt-cart-item-added', handleCartItemAdded)
        return () => window.removeEventListener('kt-cart-item-added', handleCartItemAdded)
    }, [])

    useEffect(() => {
        if (!cartBump) return
        const timer = window.setTimeout(() => setCartBump(false), 500)
        return () => window.clearTimeout(timer)
    }, [cartBump])

    // Hide on admin and employee pages
    if (pathname.startsWith('/admin') || pathname.startsWith('/employee')) return null

    const links = [
        { href: '/',            icon: 'home', label: 'Home' },
        { href: '/collections', icon: 'shop', label: 'Shop' },
        { href: '/wishlist',    icon: 'wishlist', label: 'Wishlist' },
        { href: '/feedback',    icon: 'feedback', label: 'Feedback' },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="flex items-center justify-around px-2 py-2">
                {links.map(link => (
                    <Link key={link.href} href={link.href}
                          className={'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ' +
                              (pathname === link.href ? 'text-coral' : 'text-gray-400')}>
                        <NavIcon name={link.icon} />
                        <span className="text-xs font-semibold">{link.label}</span>
                    </Link>
                ))}
                <button onClick={() => setCartOpen(true)}
                        className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-gray-400 relative">
                    <span className={cartBump ? 'kt-cart-bump' : ''}><NavIcon name="cart" /></span>
                    <span className="text-xs font-semibold">Cart</span>
                    {totalItems > 0 && (
                        <span className="absolute -top-1 right-1 bg-coral text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {totalItems}
            </span>
                    )}
                </button>
            </div>
        </div>
    )
}