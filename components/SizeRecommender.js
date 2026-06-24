'use client'
import { useState } from 'react'

const sizeChart = [
  { age: '0–3 Months',    shirt: '10"', bottom: '11"', weight: '3–6 kg' },
  { age: '3–6 Months',    shirt: '11"', bottom: '11"', weight: '6–8 kg' },
  { age: '6–9 Months',    shirt: '12"', bottom: '12"', weight: '8–9 kg' },
  { age: '9–12 Months',   shirt: '13"', bottom: '14"', weight: '9–10 kg' },
  { age: '1 Year',        shirt: '14"', bottom: '16"', weight: '10–11 kg' },
  { age: '18–24 Months',  shirt: '15"', bottom: '17"', weight: '11–13 kg' },
  { age: '2–3 Years',     shirt: '16"', bottom: '18"', weight: '13–15 kg' },
  { age: '3–4 Years',     shirt: '17"', bottom: '20"', weight: '15–17 kg' },
  { age: '4–5 Years',     shirt: '18"', bottom: '22"', weight: '17–19 kg' },
  { age: '5–6 Years',     shirt: '19"', bottom: '24"', weight: '19–21 kg' },
  { age: '6–7 Years',     shirt: '20"', bottom: '26"', weight: '21–23 kg' },
  { age: '7–8 Years',     shirt: '21–22"', bottom: '28–30"', weight: '23–27 kg' },
  { age: '9–10 Years',    shirt: '23–24"', bottom: '32"', weight: '27–32 kg' },
]

const ageOptions = [
  '0–3 Months', '3–6 Months', '6–9 Months', '9–12 Months',
  '1 Year', '18–24 Months', '2–3 Years', '3–4 Years',
  '4–5 Years', '5–6 Years', '6–7 Years', '7–8 Years', '9–10 Years',
]

export default function SizeRecommender() {
  const [age, setAge]       = useState('')
  const [result, setResult] = useState(null)
  const [open, setOpen]     = useState(false)

  function handleCheck() {
    const found = sizeChart.find(s => s.age === age)
    setResult(found || null)
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="w-full bg-skyblue/20 hover:bg-skyblue/30 text-charcoal font-display text-sm py-3 rounded-2xl transition-colors border-2 border-skyblue/30 flex items-center justify-center gap-2">
        👶 Find the Right Size for Your Child
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-skyblue/30 px-6 py-5 text-center">
              <div className="text-4xl mb-2">👶</div>
              <h3 className="font-display text-2xl text-charcoal">Size Finder</h3>
              <p className="text-gray-500 text-sm">Enter your child's age to get the right size</p>
            </div>
            <div className="p-6">
              <label className="block font-semibold text-sm text-charcoal mb-2">Child's Age</label>
              <select value={age} onChange={e => { setAge(e.target.value); setResult(null) }}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm mb-4">
                <option value="">Select age...</option>
                {ageOptions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <button onClick={handleCheck} disabled={!age}
                className="w-full bg-coral text-white font-display py-3 rounded-2xl hover:bg-opacity-90 transition-colors disabled:opacity-50 mb-4">
                Find My Size 🎯
              </button>

              {result && (
                <div className="bg-cream rounded-2xl p-4 space-y-3">
                  <p className="font-display text-lg text-charcoal text-center">
                    Recommended for <span className="text-coral">{result.age}</span>
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">Shirt</p>
                      <p className="font-display text-coral text-lg">{result.shirt}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">Bottom</p>
                      <p className="font-display text-coral text-lg">{result.bottom}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">Weight</p>
                      <p className="font-display text-coral text-sm">{result.weight}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    💡 Between sizes? Always size up!
                  </p>
                </div>
              )}

              <button onClick={() => setOpen(false)}
                className="w-full mt-3 text-gray-400 text-sm hover:text-coral transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}