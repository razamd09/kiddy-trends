'use client'
import { useEffect, useMemo, useState } from 'react'

const BASE_CUSTOMERS = 1200
const RATING_OPTIONS = [4.7, 4.8, 4.9]

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function formatCustomers(value) {
  return value.toLocaleString()
}

export default function DynamicSocialProofBar() {
  const [customers, setCustomers] = useState(BASE_CUSTOMERS)
  const [rating, setRating] = useState(4.8)

  useEffect(() => {
    // On each browser launch, start from a slightly different believable value.
    const launchOffset = randomInt(0, 8) * 5
    setCustomers(BASE_CUSTOMERS + launchOffset)
    setRating(RATING_OPTIONS[randomInt(0, RATING_OPTIONS.length - 1)])

    const customersTimer = window.setInterval(() => {
      // Keep increasing in visible steps: 1205 -> 1210 -> 1215 ...
      const bump = randomInt(1, 2) * 5
      setCustomers((prev) => prev + bump)
    }, randomInt(12000, 22000))

    const ratingTimer = window.setInterval(() => {
      setRating((prev) => {
        const candidates = RATING_OPTIONS.filter((r) => r !== prev)
        return candidates[randomInt(0, candidates.length - 1)]
      })
    }, randomInt(9000, 18000))

    return () => {
      window.clearInterval(customersTimer)
      window.clearInterval(ratingTimer)
    }
  }, [])

  const customerLabel = useMemo(() => formatCustomers(customers), [customers])

  return (
    <div className="bg-charcoal py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-4 text-white text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-sunny font-bold">🛍️ {customerLabel}+</span>
            <span className="text-gray-300">Happy Customers</span>
          </div>
          <div className="hidden sm:block w-px h-3 bg-gray-600" />
          <div className="flex items-center gap-1.5">
            <span className="text-sunny font-bold">⭐ {rating.toFixed(1)}/5</span>
            <span className="text-gray-300">Average Rating</span>
          </div>
          <div className="hidden sm:block w-px h-3 bg-gray-600" />
          <div className="flex items-center gap-1.5">
            <span className="text-sunny font-bold">📦 3-5</span>
            <span className="text-gray-300">Days Delivery</span>
          </div>
          <div className="hidden sm:block w-px h-3 bg-gray-600" />
          <div className="flex items-center gap-1.5">
            <span className="text-sunny font-bold">🔄 100%</span>
            <span className="text-gray-300">Exchange Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  )
}
