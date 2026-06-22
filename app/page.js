'use client'
import Image from 'next/image'
import Link from 'next/link'

const categories = [
  { label: 'Kids Clothing',      desc: 'Newborn to 12 years',         color: 'bg-coral/20',   emoji: '👕', href: '/collections' },
  { label: 'Kids Bedding',       desc: 'Single bed sets & covers',    color: 'bg-skyblue/30', emoji: '🛏️', href: '/collections' },
  { label: 'Bags',               desc: 'School, college & baby bags', color: 'bg-sunny/40',   emoji: '🎒', href: '/collections' },
  { label: 'Little Accessories', desc: 'Pins, ponytails & more',      color: 'bg-mint/30',    emoji: '🎀', href: '/collections' },
]

const featured = [
  { name:'Monster Hoodie',       price:'PKR 2,499', badge:'New',    color:'bg-skyblue/30', emoji:'👕' },
  { name:'Unicorn Bedsheet Set', price:'PKR 3,499', badge:'Hot 🔥', color:'bg-sunny/40',   emoji:'🦄' },
  { name:'Monster School Bag',   price:'PKR 2,999', badge:'New',    color:'bg-mint/30',    emoji:'🎒' },
  { name:'Butterfly Hair Pins',  price:'PKR 599',   badge:'Cute',   color:'bg-coral/20',   emoji:'🦋' },
]

const features = [
  { icon:'🌿', title:'Soft & Safe Fabrics',  desc:'Skin-friendly, breathable materials safe for even the most sensitive skin.' },
  { icon:'🎨', title:'Vibrant Designs',      desc:'Playful prints and colours that kids actually want to wear!' },
  { icon:'📦', title:'Fast Delivery',        desc:'Quick shipping across Pakistan. Packed with care and love.' },
  { icon:'↩️', title:'Easy Returns',         desc:'Not the right fit? Hassle-free returns within 7 days.' },
]

export default function Home() {
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
              <Image
                src="/logo.jpg"
                alt="Kiddy Trends"
                width={260}
                height={260}
                className="rounded-3xl shadow-2xl object-cover"
              />
            </div>
            <div className="absolute -top-4 right-0 bg-white rounded-2xl px-3 py-1.5 shadow-lg animate-bounce2 font-display text-coral text-xs whitespace-nowrap" style={{animationDelay:'0s'}}>
  😍 Super Soft!
</div>
<div className="absolute top-6 -left-8 bg-mint rounded-2xl px-3 py-1.5 shadow-lg font-display text-charcoal text-xs animate-float whitespace-nowrap" style={{animationDelay:'0.7s'}}>
  👩 Mom's First Choice
</div>
<div className="absolute top-1/3 -right-6 bg-coral rounded-2xl px-3 py-1.5 shadow-lg font-display text-white text-xs animate-bounce2 whitespace-nowrap" style={{animationDelay:'1.2s'}}>
  💰 Dad's Pocket Friendly
</div>
<div className="absolute top-1/2 -left-4 bg-skyblue rounded-2xl px-3 py-1.5 shadow-lg font-display text-charcoal text-xs animate-float whitespace-nowrap" style={{animationDelay:'1.8s'}}>
  🏆 Premium
</div>
<div className="absolute -bottom-2 right-8 bg-lavender rounded-2xl px-3 py-1.5 shadow-lg font-display text-white text-xs animate-bounce2 whitespace-nowrap" style={{animationDelay:'2.2s'}}>
  ⭐ Branded
</div>
<div className="absolute bottom-10 -left-6 bg-sunny rounded-2xl px-3 py-1.5 shadow-lg font-display text-charcoal text-xs animate-float whitespace-nowrap" style={{animationDelay:'0.4s'}}>
  ✨ 100% Safe
</div>
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

      {/* FEATURED PRODUCTS */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <h2 className="section-title">Trending Now 🔥</h2>
          <Link href="/collections" className="text-coral font-semibold hover:underline">See all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {featured.map(item => (
            <div key={item.name} className={`${item.color} rounded-3xl overflow-hidden card-hover`}>
              <div className="h-44 flex items-center justify-center text-7xl">
                {item.emoji}
              </div>
              <div className="p-4 bg-white/70">
                <span className="text-xs bg-coral text-white px-2 py-0.5 rounded-full font-semibold">
                  {item.badge}
                </span>
                <h4 className="font-display text-lg mt-2 text-charcoal">{item.name}</h4>
                <p className="text-coral font-bold mt-1">{item.price}</p>
                <Link href="/collections"
                  className="mt-3 w-full bg-charcoal text-white text-sm font-semibold py-2 rounded-xl hover:bg-coral transition-colors block text-center">
                  Shop Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY KIDDY TRENDS */}
      <section className="bg-coral py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-white text-center mb-12">Why Parents Love Us ❤️</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white/20 backdrop-blur rounded-3xl p-6 text-white text-center">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-display text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-white/80 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-sunny rounded-[2rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-4xl md:text-5xl text-charcoal mb-3">
              New arrivals every week!
            </h2>
            <p className="text-gray-700 text-lg">Be the first to know about new collections & deals.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <input
              type="email"
              placeholder="your@email.com"
              className="px-5 py-3 rounded-full border-2 border-charcoal/20 focus:outline-none focus:border-coral font-body text-base w-60"
            />
            <button className="btn-primary whitespace-nowrap">
              Notify Me 🔔
            </button>
          </div>
        </div>
      </section>
    </>
  )
}