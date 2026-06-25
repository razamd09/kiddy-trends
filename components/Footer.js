import Link from 'next/link'
import Image from 'next/image'

const socials = [
  {
    name: 'Instagram',
    href: 'https://instagram.com/trenydkids.2020',
    color: 'hover:bg-pink-500',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com/thetrendykidsshop',
    color: 'hover:bg-blue-600',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com/@kiddy.trends',
    color: 'hover:bg-black',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com/@kiddytrends5518',
    color: 'hover:bg-red-600',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden">
                <Image src="/logo.jpg" alt="Kiddy Trends" width={48} height={48} className="object-cover" />
              </div>
              <span className="font-display text-2xl text-coral">Kiddy Trends</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-5">
              Fun, comfy, and colourful clothing, bedding, bags & accessories for little ones — newborn to 12 years.
            </p>
            {/* Social icons */}
            <div className="flex gap-3 flex-wrap">
              {socials.map(s => (
                <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                  title={s.name}
                  className={`w-9 h-9 rounded-full bg-white/10 ${s.color} transition-colors flex items-center justify-center text-white`}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg text-sunny mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              {[
                ['/', 'Home'],
                ['/collections', 'Collections'],
                ['/about', 'About Us'],
                ['/refund-policy', 'Refund Policy'],
                ['/size-chart',    'Size Chart'],
                ['/feedback',      '💝 Share Feedback'],
                ['/order-tracking','Track Order'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-coral transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-display text-lg text-mint mb-4">Categories</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              {[
                ['/collections?cat=clothing',    '👕 Kids Clothing'],
                ['/collections?cat=bedding',     '🛏️ Kids Bedding'],
                ['/collections?cat=bags',        '🎒 Bags'],
                ['/collections?cat=accessories', '🎀 Little Accessories'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-coral transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg text-skyblue mb-4">Get In Touch</h4>
            <ul className="space-y-3 text-gray-300 text-sm">
              <li>
                <a href="https://wa.me/923360677340" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-coral transition-colors">
                  <span className="text-lg">💬</span>
                  <span>WhatsApp: 0336 0677340</span>
                </a>
              </li>
              <li>
                <a href="https://instagram.com/trenydkids.2020" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-coral transition-colors">
                  <span className="text-lg">📸</span>
                  <span>@trenydkids.2020</span>
                </a>
              </li>
              <li>
                <a href="https://facebook.com/thetrendykidsshop" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-coral transition-colors">
                  <span className="text-lg">👍</span>
                  <span>thetrendykidsshop</span>
                </a>
              </li>
              <li>
                <a href="https://tiktok.com/@kiddy.trends" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-coral transition-colors">
                  <span className="text-lg">🎵</span>
                  <span>@kiddy.trends</span>
                </a>
              </li>
              <li>
                <a href="https://youtube.com/@kiddytrends5518" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-coral transition-colors">
                  <span className="text-lg">▶️</span>
                  <span>@kiddytrends5518</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Kiddy Trends. Made with ❤️ for little ones.</p>
          <div className="flex gap-4">
            <Link href="/refund-policy" className="hover:text-coral transition-colors">Refund Policy</Link>
            <Link href="/size-chart" className="hover:text-coral transition-colors">Size Chart</Link>
            <Link href="/feedback" className="hover:text-coral transition-colors">Feedback</Link>
            <a href="/employee" className="hover:text-coral transition-colors">Staff Login</a>
          </div>
        </div>
      </div>
    </footer>
  )
}