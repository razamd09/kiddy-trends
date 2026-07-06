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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] bg-charcoal/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-charcoal/10 p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-coral mb-1">{greeting} Pakistan</p>
        <h2 className="font-display text-2xl md:text-3xl text-charcoal mb-2">What size you want to explore for your kid?</h2>
        <p className="text-gray-500 mb-6">Choose gender and age, and we will directly take you to matching products.</p>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-2">Girl / Boy</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toggleGender('girls')}
                className={'rounded-xl border-2 px-4 py-3 font-semibold transition-all ' + (selectedGenders.includes('girls') ? 'border-coral bg-coral text-white' : 'border-gray-200 text-charcoal hover:border-coral/40')}
              >
                Girl
              </button>
              <button
                type="button"
                onClick={() => toggleGender('boys')}
                className={'rounded-xl border-2 px-4 py-3 font-semibold transition-all ' + (selectedGenders.includes('boys') ? 'border-coral bg-coral text-white' : 'border-gray-200 text-charcoal hover:border-coral/40')}
              >
                Boy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-2">Age --&gt;</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-auto rounded-xl border-2 border-gray-200 p-2">
              {AGE_OPTIONS.map((opt) => (
                <button
                  key={opt.sub}
                  type="button"
                  onClick={() => toggleAge(opt.sub)}
                  className={'rounded-lg px-3 py-2 text-sm font-semibold text-left transition-all border ' + (selectedAges.includes(opt.sub) ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-gray-200 hover:border-charcoal/40')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={goToSelectedProducts}
            disabled={selectedGenders.length === 0 || selectedAges.length === 0}
            className="rounded-xl bg-coral text-white font-semibold px-4 py-3 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Explore Products
          </button>
          <button
            type="button"
            onClick={goToAllCollections}
            className="rounded-xl border-2 border-charcoal/20 text-charcoal font-semibold px-4 py-3 hover:border-charcoal/40"
          >
            Explore All
          </button>
        </div>
      </div>
    </div>
  )
}
