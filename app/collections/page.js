'use client'
import { useState } from 'react'
import Link from 'next/link'

const allProducts = [
  { id:1,  name:'Monster Hoodie',        price:2499, age:'kids',    cat:'tops',    badge:'New',   color:'bg-skyblue/30',  emoji:'👕' },
  { id:2,  name:'Rainbow Tee Set',       price:1899, age:'toddler', cat:'sets',    badge:'Hot 🔥', color:'bg-sunny/40',    emoji:'👗' },
  { id:3,  name:'Dino Jogger Pants',     price:2199, age:'kids',    cat:'bottoms', badge:'Sale',  color:'bg-mint/30',     emoji:'👖' },
  { id:4,  name:'Floral Frock',          price:2799, age:'tweens',  cat:'dresses', badge:'Fave',  color:'bg-coral/20',    emoji:'👘' },
  { id:5,  name:'Starry Night Pyjamas',  price:1699, age:'newborn', cat:'sets',    badge:'New',   color:'bg-lavender/30', emoji:'🌙' },
  { id:6,  name:'Bunny Romper',          price:1499, age:'newborn', cat:'tops',    badge:'Cute',  color:'bg-skyblue/20',  emoji:'🐰' },
  { id:7,  name:'Camo Cargo Pants',      price:2399, age:'tweens',  cat:'bottoms', badge:'',      color:'bg-mint/20',     emoji:'🪖' },
  { id:8,  name:'Sunshine Sundress',     price:2599, age:'kids',    cat:'dresses', badge:'Hot 🔥', color:'bg-sunny/30',    emoji:'☀️' },
  { id:9,  name:'Cozy Bear Jumpsuit',    price:1999, age:'toddler', cat:'sets',    badge:'',      color:'bg-coral/15',    emoji:'🐻' },
  { id:10, name:'Tie-Dye Tee',           price:1599, age:'kids',    cat:'tops',    badge:'Sale',  color:'bg-mint/25',     emoji:'🌈' },
  { id:11, name:'Balloon Skirt',         price:1799, age:'toddler', cat:'dresses', badge:'',      color:'bg-coral/25',    emoji:'🎈' },
  { id:12, name:'Sporty Track Set',      price:2899, age:'tweens',  cat:'sets',    badge:'New',   color:'bg-slate/20',    emoji:'🏃' },
]

const ages = ['All','newborn','toddler','kids','tweens']
const cats = ['All','tops','bottoms','dresses','sets']
const ageLabels = { newborn:'Newborn (0–12m)', toddler:'Toddler (1–3y)', kids:'Kids (4–8y)', tweens:'Tweens (9–12y)' }

export default function Collections() {
  const [age, setAge] = useState('All')
  const [cat, setCat] = useState('All')
  const [sort, setSort] = useState('default')

  let products = allProducts
    .filter(p => age === 'All' || p.age === age)
    .filter(p => cat === 'All' || p.cat === cat)

  if (sort === 'low')  products = [...products].sort((a,b) => a.price - b.price)
  if (sort === 'high') products = [...products].sort((a,b) => b.price - a.price)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="section-title mb-3">Our Collections 🛍️</h1>
        <p className="text-gray-500 text-lg">Cute fits for every little adventure</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl p-5 mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm">
        <div className="flex flex-wrap gap-2">
          <span className="font-semibold text-sm text-gray-500 self-center mr-1">Age:</span>
          {ages.map(a => (
            <button key={a} onClick={() => setAge(a)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${age === a ? 'bg-coral text-white' : 'bg-cream text-charcoal hover:bg-coral/10'}`}>
              {a === 'All' ? 'All' : ageLabels[a]?.split(' ')[0]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="font-semibold text-sm text-gray-500 self-center mr-1">Type:</span>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${cat === c ? 'bg-skyblue text-charcoal' : 'bg-cream text-charcoal hover:bg-skyblue/20'}`}>
              {c}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-4 py-2 rounded-full border-2 border-gray-100 text-sm font-semibold focus:outline-none focus:border-coral bg-cream">
          <option value="default">Sort: Default</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-400 mb-5 font-semibold">
        {products.length} item{products.length !== 1 ? 's' : ''} found
      </p>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="font-display text-2xl text-gray-400">No items match your filters</h3>
          <button onClick={() => { setAge('All'); setCat('All') }}
            className="btn-primary mt-5">Clear Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map(item => (
            <div key={item.id} className={`${item.color} rounded-3xl overflow-hidden card-hover`}>
              <div className="h-40 flex items-center justify-center text-6xl">
                {item.emoji}
              </div>
              <div className="p-4 bg-white/80 backdrop-blur">
                {item.badge && (
                  <span className="text-xs bg-coral text-white px-2 py-0.5 rounded-full font-semibold">
                    {item.badge}
                  </span>
                )}
                <h4 className="font-display text-base mt-2 text-charcoal leading-tight">{item.name}</h4>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{ageLabels[item.age]}</p>
                <p className="text-coral font-bold mt-1 text-sm">PKR {item.price.toLocaleString()}</p>
                <button className="mt-3 w-full bg-charcoal text-white text-sm font-semibold py-2 rounded-xl hover:bg-coral transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
