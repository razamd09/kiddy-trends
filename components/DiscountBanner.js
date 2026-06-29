'use client'
import { useState, useEffect } from 'react'

export default function DiscountBanner() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCodes() {
      try {
        const res = await fetch('/api/discount-codes')
        const data = await res.json()
        if (data.codes) {
          setCodes(data.codes)
        }
      } catch (err) {
        console.error('Error fetching discount codes:', err)
      }
      setLoading(false)
    }
    fetchCodes()
  }, [])

  if (loading || codes.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-coral/20 to-sunny/20 border-b-2 border-coral/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-center flex-wrap gap-4">
          <span className="font-display text-charcoal text-sm md:text-base">🎉 Active Discount Codes:</span>
          <div className="flex flex-wrap gap-3 justify-center">
            {codes.map((code, idx) => (
              <div key={idx} className="bg-white rounded-full px-4 py-2 shadow-sm border-2 border-coral/20 hover:border-coral/50 transition-all">
                <span className="font-mono font-bold text-coral text-sm">{code.code}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {code.discount_type === 'percentage' ? `${code.discount_value}% OFF` : `PKR ${code.discount_value} OFF`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
