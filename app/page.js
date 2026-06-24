'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import ProductCard from '../components/ProductCard'
import RewardsChecker from '../components/RewardsChecker'

const STORE_DOMAIN = 'the-kiddy-trends.myshopify.com'

const categories = [
  { label: 'Kids Clothing',      desc: 'Newborn to 12 years',         color: 'bg-coral/20',   emoji: '👕', href: '/collections' },
  { label: 'Kids Bedding',       desc: 'Single bed sets & covers',    color: 'bg-skyblue/30', emoji: '🛏️', href: '/collections' },
  { label: 'Bags',               desc: 'School, college & baby bags', color: 'bg-sunny/40',   emoji: '🎒', href: '/collections' },
  { label: 'Little Accessories', desc: 'Pins, ponytails & more',      color: 'bg-mint/30',    emoji: '🎀', href: '/collections' },
]

const features = [
  { icon:'🌿', title:'Soft & Safe Fabrics',  desc:'Skin-friendly, breathable materials safe for even the most sensitive skin.' },
  { icon:'🎨', title:'Vibrant Designs',      desc:'Playful prints and colours that kids actually want to wear!' },
  { icon:'📦', title:'Fast Delivery',        desc:'Quick shipping across Pakistan. Packed with care and love.' },
  { icon:'↩️', title:'Easy Returns',         desc:'Not the right fit? Hassle-free returns within 7 days.' },
]

export default function Home() {
  const [trending, setTrending]             = useState([])
  const [loadingTrending, setLoadingTrending] = useState(true)

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch('https://' + STORE_DOMAIN + '/products.json?limit=250', { next: { revalidate: 300 } })
        const data = await res.json()
        const all  = data.products || []

        const bags  = all.filter(p => {
          const t = (p.product_type || '').toLowerCase()
          const h = (p.title || '').toLowerCase()
          return t.includes('bag') || t.includes('backpack') || h.includes('bag') || h.includes('backpack')
        })
        const bedding = all.filter(p => {
          const t = (p.product_type || '').toLowerCase()
          const h = (p.title || '').toLowerCase()
          return t.includes('bed') || t.includes('sheet') || t.includes('pillow') || h.includes('bed') || h.includes('sheet')
        })
        const girls = all.filter(p => {
          const t = (p.tags || []).join(' ').toLowerCase()
          const h = (p.title || '').toLowerCase()
          return t.includes('girl') || h.includes('girl') || h.includes('frock') || h.includes('dress')
        })
        const boys = all.filter(p => {
          const t = (p.tags || []).join(' ').toLowerCase()
          const h = (p.title || '').toLowerCase()
          return t.includes('boy') || h.includes('boy') || h.includes('shirt') || h.includes('trouser')
        })
        const newArrivals = all.filter(p => {
          const t = (p.tags || []).join(' ').toLowerCase()
          const h = (p.title || '').toLowerCase()
          return t.includes('new') || h.includes('new arrival') || h.includes('summer')
        })

        const pick = (arr, n) => arr.sort(() => 0.5 - Math.random()).slice(0, n)
        const trending = [...pick(girls, 2), ...pick(boys, 2), ...pick(bags, 2), ...pick(bedding, 2)]
        const final = trending.length >= 6 ? trending : [...trending, ...pick(newArrivals, 8 - trending.length)]
        setTrending(final.slice(0, 8))
        setLoadingTrending(false)
      } catch { setLoadingTrending(false) }
    }
    fetchTrending()
  }, [])

  return (
    <>
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-up">
            <span className="inline-block bg-sunny text-charcoal font-display text-sm px-4 py-1.5 rounded-full mb-5">
              Newborn — 12 Years 🎉
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-charcoal leading-tight mb-6">
              Dress them
              <span className="text-coral block">to impress.</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-md">
              Kiddy Trends brings you the cutest, comfiest clothes, bedding, bags
              and accessories for little explorers. Because every day is a fashion adventure!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/collections" className="btn-primary">Shop Now 🛍️</Link>
              <Link href="/about" className="btn-outline">Our Story</Link>
            </div>
          </div>

          <div className="relative flex justify-center px-12">
            <div className="w-72 h-72 md:w-96 md:h-96 bg-skyblue/30 rounded-[60%_40%_55%_45%/50%_60%_40%_50%] flex items-center justify-center animate-float">
              <Image src="/logo.jpg" alt="Kiddy Trends" width={260} height={260} className="rounded-3xl shadow-2xl object-cover" />
            </div>
            <div className="absolute -top-4 right-0 bg-white rounded-2xl px-3 py-1.5 shadow-lg animate-bounce2 font-display text-coral text-xs whitespace-nowrap" style={{animationDelay:'0s'}}>😍 Super Soft!</div>
            <div className="absolute top-6 -left-8 bg-mint rounded-2xl px-3 py-1.5 shadow-lg font-display text-charcoal text-xs animate-float whitespace-nowrap" style={{animationDelay:'0.7s'}}>👩 Mom's First Choice</div>
            <div className="absolute top-1/3 -right-6 bg-coral rounded-2xl px-3 py-1.5 shadow-lg font-display text-white text-xs animate-bounce2 whitespace-nowrap" style={{animationDelay:'1.2s'}}>💰 Dad's Pocket Friendly</div>
            <div className="absolute top-1/2 -left-4 bg-skyblue rounded-2xl px-3 py-1.5 shadow-lg font-display text-charcoal text-xs animate-float whitespace-nowrap" style={{animationDelay:'1.8s'}}>🏆 Premium</div>
            <div className="absolute -bottom-2 right-8 bg-lavender rounded-2xl px-3 py-1.5 shadow-lg font-display text-white text-xs animate-bounce2 whitespace-nowrap" style={{animationDelay:'2.2s'}}>⭐ Branded</div>
            <div className="absolute bottom-10 -left-6 bg-sunny rounded-2xl px-3 py-1.5 shadow-lg font-display text-charcoal text-xs animate-float whitespace-nowrap" style={{animationDelay:'0.4s'}}>✨ 100% Safe</div>
          </div>
        </div>
      </section>
{/* SOCIAL PROOF BAR */}
<section className="bg-charcoal py-3">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-center justify-center gap-6 text-white text-sm">
      <div className="flex items-center gap-2">
        <span className="text-sunny font-bold text-lg">🛍️ 1,200+</span>
        <span className="text-gray-300">Happy Customers</span>
      </div>
      <div className="hidden sm:block w-px h-4 bg-gray-600" />
      <div className="flex items-center gap-2">
        <span className="text-sunny font-bold text-lg">⭐ 4.8/5</span>
        <span className="text-gray-300">Average Rating</span>
      </div>
      <div className="hidden sm:block w-px h-4 bg-gray-600" />
      <div className="flex items-center gap-2">
        <span className="text-sunny font-bold text-lg">📦 3-5</span>
        <span className="text-gray-300">Days Delivery</span>
      </div>
      <div className="hidden sm:block w-px h-4 bg-gray-600" />
      <div className="flex items-center gap-2">
        <span className="text-sunny font-bold text-lg">🔄 100%</span>
        <span className="text-gray-300">Exchange Guarantee</span>
      </div>
    </div>
  </div>
</section>
      {/* PROMO BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-charcoal rounded-3xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce2">🎉</span>
            <div>
              <p className="font-display text-white text-lg leading-tight">Summer Sale is LIVE!</p>
              <p className="text-gray-300 text-sm">Up to 50% OFF on kids clothing — Limited time only!</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-sunny text-charcoal font-display text-sm px-4 py-1.5 rounded-full">
              Use code: <strong>KIDDY20</strong>
            </div>
            <Link href="/collections"
              className="bg-coral text-white font-display text-sm px-5 py-2 rounded-full hover:bg-opacity-90 transition-all hover:scale-105">
              Shop Now →
            </Link>
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title mb-3">Shop by Category</h2>
            <p className="text-gray-500 text-lg">Everything your little one needs</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {categories.map(cat => (
              <Link key={cat.label} href={cat.href}
                className={`${cat.color} rounded-3xl p-6 text-center card-hover block`}>
                <div className="text-5xl mb-3">{cat.emoji}</div>
                <h3 className="font-display text-xl text-charcoal">{cat.label}</h3>
                <p className="text-sm text-gray-500 mt-1">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TRENDING NOW */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <h2 className="section-title">Trending Now 🔥</h2>
          <Link href="/collections" className="text-coral font-semibold hover:underline">See all →</Link>
        </div>
        {loadingTrending && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-3xl overflow-hidden animate-pulse">
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
        {!loadingTrending && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {trending.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

     

{/* TIKTOK VIDEOS */}
<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
  <div className="text-center mb-10">
    <h2 className="section-title mb-3">Watch Us on TikTok 🎵</h2>
    <p className="text-gray-500 text-lg">See our latest collections in action!</p>
    <a href="https://tiktok.com/@kiddy.trends" target="_blank" rel="noopener noreferrer"
      className="inline-block mt-3 bg-charcoal text-white font-display text-sm px-5 py-2 rounded-full hover:bg-coral transition-colors">
      Follow @kiddy.trends ➔
    </a>
  </div>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[
      '7649019831047458056',
      '7647926799875214600',
      '7649698031213858055',
      '7647962725112352018',
    ].map(id => (
      <div key={id} className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white">
        <iframe
          src={'https://www.tiktok.com/embed/v2/' + id}
          className="w-full"
          style={{height:'560px',border:'none'}}
          allowFullScreen
          allow="encrypted-media"
loading="lazy"
title={'TikTok video ' + id}
        />
      </div>
    ))}
  </div>
</section>
{/* REWARDS CHECKER */}
<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
  <RewardsChecker />
</section>
{/* INSTAGRAM */}
{/* INSTAGRAM */}
<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
  <div className="text-center mb-8">
    <div className="text-4xl mb-3">📸</div>
    <h2 className="section-title mb-2">Follow Us on Instagram</h2>
    <p className="text-gray-500 mb-1">See our latest collections & happy customers!</p>
    <a href="https://instagram.com/trenydkids.2020" target="_blank" rel="noopener noreferrer"
      className="text-coral font-bold hover:underline">@trendykids.2020</a>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {[
      'DZ7W_ZWo-k1',
      'DZ9YMmLCCjg',
      'DZ4bJK5iHA3',
      'DZ21w0hCOEz',
    ].map(id => (
      <div key={id} className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white">
        <iframe
          src={'https://www.instagram.com/p/' + id + '/embed/captioned/'}
          className="w-full"
          style={{height:'480px', border:'none'}}
          allowFullScreen
          loading="lazy"
          title={'Instagram post ' + id}
          scrolling="no"
          frameBorder="0"
        />
      </div>
    ))}
  </div>
  <div className="text-center mt-6">
    <a href="https://instagram.com/trenydkids.2020" target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-display px-8 py-3 rounded-full hover:opacity-90 transition-all hover:scale-105 shadow-md">
      📸 Follow @trendykids.2020
    </a>
  </div>
</section>
  <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-coral/10 rounded-3xl p-8 text-center">
    <div className="text-4xl mb-3">📸</div>
    <h2 className="font-display text-3xl text-charcoal mb-2">Follow Us on Instagram</h2>
    <p className="text-gray-500 mb-2">See our latest collections, styling ideas & happy customers!</p>
    <p className="text-coral font-bold text-lg mb-5">@trenydkids.2020</p>
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
      {[
        'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1543702233-b09e5c9fa60e?w=200&h=200&fit=crop',
      ].map((src, i) => (
        <a key={i} href="https://instagram.com/trenydkids.2020" target="_blank" rel="noopener noreferrer"
          className="aspect-square rounded-2xl overflow-hidden hover:opacity-80 transition-opacity">
          <img src={src} alt={'Instagram post ' + (i+1)} className="w-full h-full object-cover" loading="lazy" />
        </a>
      ))}
    </div>
    <a href="https://instagram.com/trenydkids.2020" target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-display px-8 py-3 rounded-full hover:opacity-90 transition-all hover:scale-105 shadow-md">
      📸 Follow @trenydkids.2020
    </a>
  </div>
</section>

      {/* NEWSLETTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-sunny rounded-[2rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-4xl md:text-5xl text-charcoal mb-3">New arrivals every week!</h2>
            <p className="text-gray-700 text-lg">Be the first to know about new collections & deals.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <input type="email" placeholder="your@email.com"
              className="px-5 py-3 rounded-full border-2 border-charcoal/20 focus:outline-none focus:border-coral font-body text-base w-60" />
            <button className="btn-primary whitespace-nowrap">Notify Me 🔔</button>
          </div>
        </div>
      </section>
    </>
  )
}