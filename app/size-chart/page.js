'use client'
import { useState } from 'react'

const sizeData = {
  clothing: {
    label: 'Kids Clothing Size Chart',
    color: 'bg-skyblue/20',
    headers: ['Age', 'Shirt (inches)', 'Bottom / Trouser / Tights / Jeans (inches)'],
    rows: [
      ['0–3 Months',           '10', '11'],
      ['3–6 Months',           '11', '11'],
      ['6–9 Months',           '12', '12'],
      ['9–12 Months',          '13', '14'],
      ['12–18 Months (1 Year)','14', '16'],
      ['18–24 Months',         '15', '17'],
      ['2–3 Year',             '16', '18'],
      ['3–4 Year',             '17', '20'],
      ['4–5 Year',             '18', '22'],
      ['5–6 Year',             '19', '24'],
      ['6–7 Year',             '20', '26'],
      ['7–8 Year',             '21/22', '28/30'],
      ['9–10 Year',            '23/24', '32'],
    ],
  },
  bedding: {
    label: 'Single Bedding Size Guide',
    color: 'bg-sunny/30',
    headers: ['Item', 'Standard Size (inches)', 'Notes'],
    rows: [
      ['Single Bedsheet',   '60 × 90',  'Fits standard single bed'],
      ['Pillow Cover',      '18 × 28',  'Standard pillow size'],
      ['Duvet / Razai',     '60 × 90',  'Matches bedsheet size'],
      ['Fitted Sheet',      '36 × 75',  'For single mattress'],
    ],
  },
  bags: {
    label: 'Bag Size Guide',
    color: 'bg-mint/20',
    headers: ['Type', 'Dimensions (inches)', 'Best For'],
    rows: [
      ['Mini Toddler Bag',    '10 × 8 × 4',   '1–3 years'],
      ['Kids School Bag',     '14 × 11 × 5',  '3–8 years'],
      ['Large School Bag',    '17 × 13 × 6',  '8–12 years'],
      ['College / Laptop Bag','18 × 14 × 7',  '12+ years'],
      ['Mummy Baby Bag',      '20 × 14 × 8',  'Newborn essentials'],
    ],
  },
}

const tabs = ['clothing', 'bedding', 'bags']
const tabLabels = { clothing: '👕 Clothing', bedding: '🛏️ Bedding', bags: '🎒 Bags' }

export default function SizeChart() {
  const [active, setActive] = useState('clothing')
  const data = sizeData[active]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

      {/* Header */}
      <div className="text-center mb-10">
        <span className="inline-block bg-mint text-charcoal font-display text-sm px-4 py-1.5 rounded-full mb-4">
          Find Your Perfect Fit 📏
        </span>
        <h1 className="section-title mb-3">Size Chart</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          All measurements are in inches. Between sizes? We recommend sizing up for room to grow.
        </p>
      </div>

      {/* Tip banner */}
      <div className="bg-sunny/40 rounded-2xl p-5 mb-8 flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <div>
          <p className="font-semibold text-charcoal">How to measure</p>
          <p className="text-sm text-gray-600 mt-0.5">
            Shirt: measure chest width flat (half chest). Bottom: measure waist flat (half waist).
            Always compare to your child's actual measurements — not just their age.
          </p>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Table */}
      <div className={`${data.color} rounded-3xl overflow-hidden`}>
        <div className="p-5 pb-0">
          <h2 className="font-display text-2xl text-charcoal mb-4">{data.label}</h2>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {data.headers.map(h => (
                  <th key={h} className="text-left font-display text-base text-charcoal pb-3 pr-8 border-b-2 border-white/50 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white/30' : ''}>
                  {row.map((cell, j) => (
                    <td key={j} className={`py-3 pr-8 whitespace-nowrap ${j === 0 ? 'font-display text-base text-coral' : 'text-gray-700 font-semibold'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-display text-xl text-charcoal mb-3">📝 Important Notes</h3>
        <ul className="space-y-2 text-gray-600 text-sm">
          <li>• All measurements are in <strong>inches</strong> (half chest / half waist).</li>
          <li>• Sizes may vary slightly between different styles (fitted vs relaxed cut).</li>
          <li>• Pyjamas and loungewear run a little bigger for comfortable sleep.</li>
          <li>• If between two sizes, we recommend sizing up for room to grow.</li>
          <li>• Still unsure? WhatsApp us with your child's measurements!</li>
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <a href="https://wa.me/923360677340" target="_blank" rel="noopener noreferrer"
          className="inline-block bg-coral text-white font-display px-8 py-3 rounded-full text-lg hover:scale-105 transition-transform shadow-md">
          📱 Ask Us for Size Help
        </a>
      </div>
    </div>
  )
}