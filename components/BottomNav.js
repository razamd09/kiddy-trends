'use client'
import Link from 'next/link'
import { useCart } from '../context/CartContext'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
    const { totalItems, setCartOpen } = useCart()
    const pathname = usePathname()

    // Hide on admin and employee pages
    if (pathname.startsWith('/admin') || pathname.startsWith('/employee')) return null

    const links = [
        { href: '/',            icon: '🏠', label: 'Home' },
        { href: '/collections', icon: '👕', label: 'Shop' },
        { href: '/wishlist',    icon: '💝', label: 'Wishlist' },
        { href: '/feedback',    icon: '⭐', label: 'Feedback' },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="flex items-center justify-around px-2 py-2">
                {links.map(link => (
                    <Link key={link.href} href={link.href}
                          className={'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ' +
                              (pathname === link.href ? 'text-coral' : 'text-gray-400')}>
                        <span className="text-xl">{link.icon}</span>
                        <span className="text-xs font-semibold">{link.label}</span>
                    </Link>
                ))}
                <button onClick={() => setCartOpen(true)}
                        className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-gray-400 relative">
                    <span className="text-xl">🛒</span>
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