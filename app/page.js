  'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import ProductCard from '../components/ProductCard'
import FlashSaleBanner from '../components/FlashSaleBanner'
import RewardsChecker from '../components/RewardsChecker'
import SpinWheelPopup from '../components/SpinWheelPopup'
import DiscountBanner from '../components/DiscountBanner'
import LandingPreferencePopup from '../components/LandingPreferencePopup'

const NEW_ARRIVALS_TARGET = 10
const FLASH_SALE_RIGHT_OFFSET_Y = 0

const categories = [
  { label: 'Kids Clothing',      desc: 'Newborn to 12 years',         color: 'bg-coral/20',   emoji: '👕', href: '/collections' },
  { label: 'Kids Bedding',       desc: 'Single bed sets & covers',    color: 'bg-skyblue/30', emoji: '🛏️', href: '/collections' },
  { label: 'Bags',               desc: 'School, college & baby bags', color: 'bg-sunny/40',   emoji: '🎒', href: '/collections' },
  { label: 'Little Accessories', desc: 'Pins, ponytails & more',      color: 'bg-mint/30',    emoji: '🎀', href: '/collections' },
]

export default function Home() {
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await fetch('/api/products?limit=120&page=1').then(r => r.json())
        const nextProducts = Array.isArray(data?.products)
          ? data.products.slice(0, NEW_ARRIVALS_TARGET)
          : []

        setProducts(nextProducts)
        setLoadingProducts(false)
      } catch { setLoadingProducts(false) }
    }
    fetchProducts()
  }, [])

  return (
      <>
        <LandingPreferencePopup />
        <SpinWheelPopup />
        <DiscountBanner />
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

        {/* FLASH SALE TIMER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-6">
          <FlashSaleBanner rightSideOffsetY={FLASH_SALE_RIGHT_OFFSET_Y} />
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
                        className={cat.color + ' rounded-3xl p-6 text-center card-hover block'}>
                    <div className="text-5xl mb-3">{cat.emoji}</div>
                    <h3 className="font-display text-xl text-charcoal">{cat.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">{cat.desc}</p>
                  </Link>
              ))}
            </div>
          </div>
        </section>

        {/* NEW ARRIVALS */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="section-title">New Arrivals 🆕</h2>
          </div>
          {loadingProducts && (
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
          {!loadingProducts && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {products.map(product => (
                      <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Link
                    href="/collections"
                    className="text-coral font-semibold hover:underline"
                  >
                    Show More →
                  </Link>
                </div>
              </>
          )}
        </section>

        {/* TIKTOK VIDEOS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="section-title mb-3">Watch Us on TikTok 🎵</h2>
            <p className="text-gray-500 text-lg">See our latest collections in action!</p>
            <a href="https://www.tiktok.com/@kiddy.trends?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer"
               className="inline-block mt-3 bg-charcoal text-white font-display text-sm px-5 py-2 rounded-full hover:bg-coral transition-colors">
              Follow @kiddy.trends ➔
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['7649019831047458056','7647926799875214600','7649698031213858055','7647962725112352018'].map(id => (
                <div key={id} className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white">
                  <iframe src={'https://www.tiktok.com/embed/v2/' + id} className="w-full"
                          style={{height:'560px',border:'none'}} allowFullScreen allow="encrypted-media"
                          loading="lazy" title={'TikTok video ' + id} />
                </div>
            ))}
          </div>
        </section>

        {/* REWARDS CHECKER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <RewardsChecker />
        </section>

        {/* INSTAGRAM */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">📸</div>
            <h2 className="section-title mb-2">Follow Us on Instagram</h2>
            <p className="text-gray-500 mb-1">See our latest collections & happy customers!</p>
            <a href="https://instagram.com/trendykids.2020" target="_blank" rel="noopener noreferrer"
               className="text-coral font-bold hover:underline">@trendykids.2020</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['DZ7W_ZWo-k1','DZ9YMmLCCjg','DZ4bJK5iHA3','DZ21w0hCOEz'].map(id => (
                <div key={id} className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white min-h-[480px]">
                  <iframe src={'https://www.instagram.com/p/' + id + '/embed/captioned/'}
                          className="w-full" style={{height:'480px',border:'none'}}
                          allowFullScreen loading="lazy" title={'Instagram post ' + id}
                          scrolling="no" />
                </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <a href="https://instagram.com/trendykids.2020" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-display px-8 py-3 rounded-full hover:opacity-90 transition-all hover:scale-105 shadow-md">
              📸 Follow @trendykids.2020
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