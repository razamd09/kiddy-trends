'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const AGE_OPTIONS = [
  { label: '0-3 Months', cat: 'newborn', sub: '0-3m' },
  { label: '3-6 Months', cat: 'newborn', sub: '3-6m' },
  { label: '6-9 Months', cat: 'newborn', sub: '6-9m' },
  { label: '9-12 Months', cat: 'newborn', sub: '9-12m' },
  { label: '12-18 Months', cat: 'toddler', sub: '12-18m' },
  { label: '18-24 Months', cat: 'toddler', sub: '18-24m' },
  { label: '2-3 Year', cat: 'toddler', sub: '2-3y' },
  { label: '3-4 Year', cat: 'kids', sub: '3-4y' },
  { label: '4-5 Year', cat: 'kids', sub: '4-5y' },
  { label: '5-6 Year', cat: 'kids', sub: '5-6y' },
  { label: '6-7 Year', cat: 'kids', sub: '6-7y' },
  { label: '7-8 Year', cat: 'kids', sub: '7-8y' },
  { label: '9-10 Year', cat: 'tweens', sub: '9-10y' },
  { label: '11-12 Year', cat: 'tweens', sub: '11-12y' },
]

function getPakistanGreeting() {
  try {
    const hourText = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      hour: 'numeric',
      hour12: false,
    }).format(new Date())
    const hour = Number(hourText)

    if (hour >= 5 && hour < 12) return 'Good Morning'
    if (hour >= 12 && hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  } catch {
    const localHour = new Date().getHours()
    if (localHour >= 5 && localHour < 12) return 'Good Morning'
    if (localHour >= 12 && localHour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }
}

export default function LandingPreferencePopup() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedGenders, setSelectedGenders] = useState([])
  const [selectedAges, setSelectedAges] = useState([])
  const greeting = useMemo(() => getPakistanGreeting(), [])

  useEffect(() => {
    const id = window.setTimeout(() => setOpen(true), 300)
    return () => window.clearTimeout(id)
  }, [])

  function toggleGender(value) {
    setSelectedGenders((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  function toggleAge(value) {
    setSelectedAges((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  function goToSelectedProducts() {
    if (selectedAges.length === 0 || selectedGenders.length === 0) return

    const catSet = new Set(
      AGE_OPTIONS.filter((opt) => selectedAges.includes(opt.sub)).map((opt) => opt.cat)
    )
    const cat = catSet.size === 1 ? [...catSet][0] : 'all'

    const params = new URLSearchParams({
      cat,
      ages: selectedAges.join(','),
      genders: selectedGenders.join(','),
    })

    setOpen(false)
    router.push('/collections?' + params.toString())
  }

  function goToAllCollections() {
    setOpen(false)
    router.push('/collections')
  }

  function closePopup() {
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] bg-gradient-to-br from-coral/35 via-skyblue/30 to-mint/35 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl rounded-[2rem] bg-gradient-to-br from-white via-cream to-sunny/30 shadow-2xl border border-white/70 p-6 md:p-8 overflow-hidden">
        <button
          type="button"
          onClick={closePopup}
          aria-label="Close popup"
          className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-500 shadow-sm transition-colors hover:border-coral/30 hover:text-charcoal"
        >
          ✕
        </button>
        <div className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full bg-coral/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-10 w-52 h-52 rounded-full bg-skyblue/30 blur-2xl" />

        <div className="relative">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-coral bg-white/85 border border-coral/20 rounded-full px-3 py-1 mb-3">
            <span>✨</span>
            {greeting}
          </p>
          <h2 className="font-display text-2xl md:text-4xl text-charcoal mb-2 leading-tight">What size you want to explore for your kid?</h2>
          <p className="text-charcoal/70 mb-6">Pick one or many options. We will instantly show matching products for your choices.</p>
        </div>

        <div className="grid gap-5 relative">
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-2">Girl / Boy</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toggleGender('girls')}
                className={'rounded-2xl border-2 px-4 py-3 font-semibold transition-all duration-200 ' + (selectedGenders.includes('girls') ? 'border-coral bg-gradient-to-r from-coral to-[#ff8b7a] text-white shadow-md scale-[1.02]' : 'border-coral/20 bg-white/85 text-charcoal hover:border-coral/50')}
              >
                👧 Girl
              </button>
              <button
                type="button"
                onClick={() => toggleGender('boys')}
                className={'rounded-2xl border-2 px-4 py-3 font-semibold transition-all duration-200 ' + (selectedGenders.includes('boys') ? 'border-skyblue bg-gradient-to-r from-skyblue to-[#70d4ff] text-charcoal shadow-md scale-[1.02]' : 'border-skyblue/30 bg-white/85 text-charcoal hover:border-skyblue/60')}
              >
                🧒 Boy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-2">Age --&gt;</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-auto rounded-2xl border-2 border-charcoal/10 bg-white/85 p-2.5">
              {AGE_OPTIONS.map((opt) => (
                <button
                  key={opt.sub}
                  type="button"
                  onClick={() => toggleAge(opt.sub)}
                  className={'rounded-xl px-3 py-2 text-sm font-semibold text-left transition-all border ' + (selectedAges.includes(opt.sub) ? 'bg-gradient-to-r from-charcoal to-[#3b4b58] text-white border-charcoal shadow-sm' : 'bg-white text-charcoal border-gray-200 hover:border-coral/40')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-3 relative">
          <button
            type="button"
            onClick={goToSelectedProducts}
            disabled={selectedGenders.length === 0 || selectedAges.length === 0}
            className="rounded-2xl bg-gradient-to-r from-coral to-[#ff8a6f] text-white font-semibold px-4 py-3 hover:opacity-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Explore Products 🎯
          </button>
          <button
            type="button"
            onClick={goToAllCollections}
            className="rounded-2xl border-2 border-charcoal/20 bg-white/85 text-charcoal font-semibold px-4 py-3 hover:border-charcoal/40"
          >
            Explore All 🌈
          </button>
          <button
            type="button"
            onClick={closePopup}
            className="sm:col-span-2 rounded-2xl border-2 border-gray-200 bg-white/85 text-gray-500 font-semibold px-4 py-3 hover:border-gray-300 hover:text-charcoal"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
