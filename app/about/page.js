import Image from 'next/image'
import Link from 'next/link'

const values = [
  { emoji:'🌿', title:'Safe Materials',    desc:'We source only hypoallergenic, OEKO-TEX certified fabrics. Your baby\'s skin is our top priority.' },
  { emoji:'🎨', title:'Fun by Design',     desc:'Our in-house team of designers takes inspiration straight from kids — wild, colourful, and full of joy.' },
  { emoji:'🤝', title:'Honest Pricing',    desc:'Premium quality doesn\'t have to mean premium prices. We keep it fair for every family.' },
  { emoji:'🇵🇰', title:'Made with Love',  desc:'Proudly based in Lahore, crafting tiny outfits that bring big smiles across Pakistan.' },
]



export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-skyblue/20 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block bg-coral text-white font-display text-sm px-4 py-1.5 rounded-full mb-5">
            Our Story 💛
          </span>
          <h1 className="section-title mb-6">
            We believe every kid deserves to dress like the star they are ⭐
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
            Kiddy Trends was born out of a simple idea: children's clothing should be as fun, 
            bold, and full of life as the kids who wear it. Founded in Lahore in 2021, we've 
            been dressing little ones from newborn to 12 years with clothes that parents trust 
            and kids actually want to wear.
          </p>
        </div>
      </section>

      {/* Story section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl text-charcoal mb-5">How it all started</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              It started with a founder who couldn't find cute, affordable clothes for her toddler 
              that were also safe enough for sensitive skin. After months of searching — and 
              coming up empty — she decided to make them herself.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              What began as a small home project quickly grew into Kiddy Trends, a brand loved 
              by thousands of families across Pakistan. We now ship nationwide and are expanding 
              our collections every season.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our mission hasn't changed: make kids look adorable, feel comfortable, and let 
              parents breathe easy knowing the fabrics are safe.
            </p>
          </div>
          <div className="bg-sunny/30 rounded-[3rem] p-10 flex items-center justify-center">
            <div className="text-center">
              <Image src="/logo.jpg" alt="Kiddy Trends" width={180} height={180} className="rounded-3xl shadow-xl mx-auto mb-4" />
              <p className="font-display text-2xl text-coral">Kiddy Trends</p>
              <p className="text-gray-500 text-sm">Est. 2021 · Lahore, Pakistan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-12">What we stand for</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {values.map(v => (
              <div key={v.title} className="bg-cream rounded-3xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{v.emoji}</div>
                <h3 className="font-display text-xl text-charcoal mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      {/* CTA */}
      <section className="bg-coral py-14 text-center">
        <h2 className="font-display text-4xl text-white mb-4">Ready to shop?</h2>
        <p className="text-white/80 mb-7 text-lg">Discover the latest Kiddy Trends collections.</p>
        <Link href="/collections" className="bg-white text-coral font-display px-8 py-3 rounded-full text-lg hover:scale-105 transition-transform inline-block shadow-md">
          Browse Collections 🛍️
        </Link>
      </section>
    </div>
  )
}
