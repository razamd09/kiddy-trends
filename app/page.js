'use client'
import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import ProductCard from '../components/ProductCard'
import RewardsChecker from '../components/RewardsChecker'
import DiscountBanner from '../components/DiscountBanner'
import LandingPreferencePopup from '../components/LandingPreferencePopup'
import HomeHeroSlider from '../components/HomeHeroSlider'
import LazyMount from '../components/LazyMount'

const NEW_ARRIVALS_TARGET = 15

const categories = [
  { label: 'Kids Clothing',      desc: 'Newborn to 12 years',         icon: 'shirt',    href: '/collections?cat=clothing' },
  { label: 'Kids Bedding',       desc: 'Single bed sets & covers',    icon: 'bed',      href: '/collections?cat=bedding' },
  { label: 'Bags',               desc: 'School, college & baby bags', icon: 'backpack', href: '/collections?cat=bags' },
  { label: 'Little Accessories', desc: 'Pins, ponytails & more',      icon: 'sparkle',  href: '/collections?cat=accessories' },
]

/* --- small inline icon set — no new dependency required --- */
function Icon({ name, className = 'w-6 h-6' }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7 }
  switch (name) {
    case 'shirt':
      return <svg {...common}><path d="M8 4l4 2 4-2 4 4-3 3v9H7v-9L4 8l4-4z" /></svg>
    case 'bed':
      return <svg {...common}><path d="M3 18v-7a2 2 0 012-2h14a2 2 0 012 2v7M3 18v2M21 18v2M3 13h18" /></svg>
    case 'backpack':
      return <svg {...common}><path d="M7 8V6a5 5 0 0110 0v2M6 8h12l1 13H5L6 8z" /><path d="M9 12h6" /></svg>
    case 'sparkle':
      return <svg {...common}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></svg>
    case 'star':
      return <svg {...common} fill="currentColor" stroke="none"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8L5.7 21l1.7-7-5.4-4.7 7.1-.6L12 2z" /></svg>
    case 'users':
      return <svg {...common}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 19c.6-3 3-5 6.5-5s5.9 2 6.5 5" /><circle cx="17" cy="8.5" r="2.6" /><path d="M15.8 14c2.6.3 4.6 2 5.1 4.3" /></svg>
    case 'truck':
      return <svg {...common}><path d="M3 7h11v9H3z" /><path d="M14 11h4l3 3v2h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></svg>
    case 'refresh':
      return <svg {...common}><path d="M3 12a9 9 0 0115.4-6.4M21 12a9 9 0 01-15.4 6.4" /><path d="M18.4 3v4.2h-4.2M5.6 21v-4.2h4.2" /></svg>
    default:
      return null
  }
}

export default function Home() {
  const [allProducts, setAllProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [activeView, setActiveView] = useState('new-arrivals')

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await fetch('/api/products?limit=120&page=1').then(r => r.json())
        const nextProducts = Array.isArray(data?.products) ? data.products : []

        setAllProducts(nextProducts)
        setLoadingProducts(false)
      } catch { setLoadingProducts(false) }
    }
    fetchProducts()
  }, [])

  const visibleProducts = useMemo(() => {
    const matchesWinterTitle = (product) => String(product.title || '').toLowerCase().includes('winter')

    if (activeView === 'winter-arrivals') {
      return allProducts.filter(matchesWinterTitle)
    }

    return allProducts.slice(0, NEW_ARRIVALS_TARGET)
  }, [activeView, allProducts])

  return (
      <>
        <LandingPreferencePopup />
        <DiscountBanner />
        {/* HERO */}
        <HomeHeroSlider />

        {/* SHOP BY CATEGORY */}
        <section id="shop-by-category" className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="section-title mb-3">Shop by Category</h2>
              <p className="text-gray-500 text-lg">Everything your little one needs</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {categories.map(cat => (
                  <Link key={cat.label} href={cat.href}
                        className="rounded-xl border border-gray-200 p-6 text-center card-hover block bg-white hover:border-coral/40 transition-colors">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-coral/10 flex items-center justify-center">
                      <Icon name={cat.icon} className="w-6 h-6 text-coral" />
                    </div>
                    <h3 className="font-display text-xl text-charcoal">{cat.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">{cat.desc}</p>
                  </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ARRIVAL TABS */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="section-title">
                {activeView === 'winter-arrivals' ? 'Winter Arrivals' : 'New Arrivals'}
              </h2>
              <p className="text-gray-500 text-sm mt-2">
                {activeView === 'winter-arrivals'
                  ? 'Warm picks for the colder season'
                  : 'Freshly added styles for this week'}
              </p>
            </div>
            <div className="inline-flex rounded-full bg-white p-1 shadow-sm border border-gray-200 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setActiveView('new-arrivals')}
                className={'flex-1 md:flex-none px-5 py-2 rounded-full text-sm font-semibold transition-colors ' +
                  (activeView === 'new-arrivals'
                    ? 'bg-coral text-white shadow'
                    : 'text-charcoal hover:text-coral')}
              >
                New Arrivals
              </button>
              <button
                type="button"
                onClick={() => setActiveView('winter-arrivals')}
                className={'flex-1 md:flex-none px-5 py-2 rounded-full text-sm font-semibold transition-colors ' +
                  (activeView === 'winter-arrivals'
                    ? 'bg-coral text-white shadow'
                    : 'text-charcoal hover:text-coral')}
              >
                Winter Arrivals
              </button>
            </div>
          </div>
          {loadingProducts && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-xl overflow-hidden animate-pulse">
                      <div className="h-48 bg-gray-200" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-8 bg-gray-200 rounded-xl mt-3" />
                      </div>
                    </div>
                ))}
              </div>
          )}
          {!loadingProducts && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {visibleProducts.map(product => (
                      <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Link
                    href={activeView === 'winter-arrivals' ? '/collections?search=winter' : '/collections'}
                    className="text-coral font-semibold hover:underline"
                  >
                    Show more →
                  </Link>
                </div>
              </>
          )}
        </section>

        {/* TIKTOK VIDEOS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50 rounded-3xl">
          <div className="text-center mb-10">
            <h2 className="section-title mb-3">Watch Us on TikTok</h2>
            <p className="text-gray-500 text-lg">See our latest collections in action</p>
            <a href="https://www.tiktok.com/@kiddy.trends?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer"
               className="inline-block mt-3 border border-charcoal/20 text-charcoal font-display text-sm px-5 py-2 rounded-full hover:border-coral hover:text-coral transition-colors">
              Follow @kiddy.trends →
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['7649019831047458056','7647926799875214600','7649698031213858055','7647962725112352018'].map(id => (
                <div key={id} className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                  <LazyMount minHeight={560}>
                    <iframe src={'https://www.tiktok.com/embed/v2/' + id} className="w-full"
                            style={{height:'560px',border:'none'}} allowFullScreen allow="encrypted-media"
                            loading="lazy" title={'TikTok video ' + id} />
                  </LazyMount>
                </div>
            ))}
          </div>
        </section>

        {/* REWARDS CHECKER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-16">
          <RewardsChecker />
        </section>

        {/* INSTAGRAM */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="text-center mb-8">
            <h2 className="section-title mb-2">Follow Us on Instagram</h2>
            <p className="text-gray-500 mb-1">See our latest collections & happy customers</p>
            <a href="https://instagram.com/trendykids.2020" target="_blank" rel="noopener noreferrer"
               className="text-coral font-bold hover:underline">@trendykids.2020</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['DZ7W_ZWo-k1','DZ9YMmLCCjg','DZ4bJK5iHA3','DZ21w0hCOEz'].map(id => (
                <div key={id} className="rounded-xl overflow-hidden border border-gray-200 bg-white min-h-[480px]">
                  <LazyMount minHeight={480}>
                    <iframe src={'https://www.instagram.com/p/' + id + '/embed/captioned/'}
                            className="w-full" style={{height:'480px',border:'none'}}
                            allowFullScreen loading="lazy" title={'Instagram post ' + id}
                            scrolling="no" />
                  </LazyMount>
                </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <a href="https://instagram.com/trendykids.2020" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 border border-gray-300 text-charcoal font-display px-8 py-3 rounded-full hover:border-coral hover:text-coral transition-colors">
              Follow @trendykids.2020
            </a>
          </div>
        </section>

        {/* NEWSLETTER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="border border-gray-200 rounded-2xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-3xl md:text-4xl text-charcoal mb-3">New arrivals every week</h2>
              <p className="text-gray-600 text-lg">Be the first to know about new collections & deals.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <input type="email" placeholder="your@email.com"
                     className="px-5 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-coral font-body text-base w-60" />
              <button className="btn-primary whitespace-nowrap">Notify me</button>
            </div>
          </div>
        </section>
      </>
  )
}
