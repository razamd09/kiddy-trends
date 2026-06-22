'use client'
import { useState } from 'react'

const sizeData = {
  newborn: {
    label: 'Newborn (0–12 months)',
    color: 'bg-skyblue/20',
    headers: ['Size Label', 'Age', 'Weight (lbs)', 'Height (in)', 'Chest (in)', 'Waist (in)'],
    rows: [
      ['NB',  '0–1 month',   '5.5–8.8',   '17.7–21.7', '13.8–15.0', '13.4–14.2'],
      ['0–3', '0–3 months',  '8.8–13.2',  '21.7–24.4', '15.0–16.1', '14.2–15.4'],
      ['3–6', '3–6 months',  '13.2–17.6', '24.4–26.8', '16.1–16.9', '15.4–16.1'],
      ['6–9', '6–9 months',  '16.5–19.8', '26.8–29.1', '16.9–17.7', '16.1–16.9'],
      ['9–12','9–12 months', '19.8–23.1', '29.1–31.5', '17.7–18.5', '16.9–17.7'],
    ],
  },
  toddler: {
    label: 'Toddler (1–3 years)',
    color: 'bg-sunny/30',
    headers: ['Size Label', 'Age', 'Weight (lbs)', 'Height (in)', 'Chest (in)', 'Waist (in)'],
    rows: [
      ['1Y', '12–18 months', '22–25.3',  '31.5–33.9', '18.5–19.3', '17.7–18.5'],
      ['2Y', '18–24 months', '25.3–28.7','33.9–36.2', '19.3–20.1', '18.5–19.3'],
      ['3Y', '2–3 years',    '28.7–33.1','36.2–38.6', '20.1–20.9', '19.3–20.1'],
    ],
  },
  kids: {
    label: 'Kids (4–8 years)',
    color: 'bg-mint/20',
    headers: ['Size Label', 'Age', 'Weight (lbs)', 'Height (in)', 'Chest (in)', 'Waist (in)'],
    rows: [
      ['4Y', '3–4 years', '33–37.5', '38.6–40.9', '20.9–21.7', '20.1–20.9'],
      ['5Y', '4–5 years', '37.5–42', '40.9–43.3', '21.7–22.4', '20.9–21.7'],
      ['6Y', '5–6 years', '42–48.5', '43.3–45.7', '22.4–23.6', '21.7–22.4'],
      ['7Y', '6–7 years', '48.5–55', '45.7–48.0', '23.6–24.4', '22.4–23.2'],
      ['8Y', '7–8 years', '55–59.5', '48.0–50.4', '24.4–25.6', '23.2–24.0'],
    ],
  },
  tweens: {
    label: 'Tweens (9–12 years)',
    color: 'bg-coral/15',
    headers: ['Size Label', 'Age', 'Weight (lbs)', 'Height (in)', 'Chest (in)', 'Waist (in)'],
    rows: [
      ['9Y',  '8–9 years',   '59.5–66',   '50.4–52.8', '25.6–26.8', '24.0–24.8'],
      ['10Y', '9–10 years',  '66–75',     '52.8–55.1', '26.8–28.0', '24.8–25.6'],
      ['11Y', '10–11 years', '75–83.8',   '55.1–57.5', '28.0–29.1', '25.6–26.4'],
      ['12Y', '11–12 years', '83.8–92.6', '57.5–59.8', '29.1–30.7', '26.4–27.6'],
    ],
  },
}

const tabs = ['newborn','toddler','kids','tweens']
const tabLabels = { newborn:'👶 Newborn', toddler:'🧸 Toddler', kids:'🎒 Kids', tweens:'⭐ Tweens' }

export default function SizeChart() {
  const [active, setActive] = useState('newborn')
  const data = sizeData[active]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="text-center mb-10">
        <span className="inline-block bg-mint text-charcoal font-display text-sm px-4 py-1.5 rounded-full mb-4">
          Find Your Perfect Fit 📏
        </span>
        <h1 className="section-title mb-3">Size Chart</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          All measurements are in inches. Between sizes? We recommend sizing up for room to grow.
        </p>
      </div>

      <div className="bg-sunny/40 rounded-2xl p-5 mb-8 flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <div>
          <p className="font-semibold text-charcoal">How to measure</p>
          <p className="text-sm text-gray-600 mt-0.5">
            Chest: measure around the fullest part. Waist: measure around the natural waistline.
            Height: measure without shoes. Always compare to the child's actual measurements — not just their age.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-7">
        {tabs.map(t => (
          <button key={t} onClick={() => setActive(t)}
            className={`px-5 py-2.5 rounded-full font-display text-base transition-all ${
              active === t ? 'bg-coral text-white shadow-md' : 'bg-white text-charcoal hover:bg-coral/10'
            }`}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      <div className={`${data.color} rounded-3xl overflow-hidden`}>
        <div className="p-5 pb-0">
          <h2 className="font-display text-2xl text-charcoal mb-4">{data.label}</h2>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {data.headers.map(h => (
                  <th key={h} className="text-left font-display text-base text-charcoal pb-3 pr-6 border-b-2 border-white/50 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i} className={`${i % 2 === 0 ? 'bg-white/30' : ''} rounded-xl`}>
                  {row.map((cell, j) => (
                    <td key={j} className={`py-3 pr-6 whitespace-nowrap ${j === 0 ? 'font-display text-lg text-coral' : 'text-gray-700'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-display text-xl text-charcoal mb-3">📝 Important Notes</h3>
        <ul className="space-y-2 text-gray-600 text-sm">
          <li>• Sizes may vary slightly between different product styles (fitted vs relaxed cut).</li>
          <li>• Our pyjamas and loungewear run a little bigger for comfortable sleep.</li>
          <li>• Dresses and frocks include an extra 1 inch for ease of movement.</li>
          <li>• If you're between two sizes, check the product description — it usually notes the fit type.</li>
          <li>• Still unsure? WhatsApp us with your child's measurements and we'll recommend the right size!</li>
        </ul>
      </div>

      <div className="mt-8 text-center">
        <a href="https://wa.me/923000000000"
          className="inline-block bg-coral text-white font-display px-8 py-3 rounded-full text-lg hover:scale-105 transition-transform shadow-md">
          📱 Ask Us for Size Help
        </a>
      </div>
    </div>
  )
}