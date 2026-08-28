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

function TrustIcon({ name }) {
  const common = { className: 'w-4 h-4 text-sunny', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    customers: <><circle cx="9" cy="8" r="3" /><path d="M3 20c.5-3 2.5-5 6-5s5.5 2 6 5" /><path d="M16 5.5a2.5 2.5 0 0 1 0 5M17 15c2.2.4 3.5 2 4 4" /></>,
    rating: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    delivery: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="19" r="1.5" /><circle cx="18" cy="19" r="1.5" /></>,
    exchange: <><path d="M4 7h13l-3-3M20 17H7l3 3" /><path d="M17 4v3M7 17v3" /></>,
  }
  return <svg {...common}>{paths[name]}</svg>
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
            <span className="text-sunny font-bold inline-flex items-center gap-1"><TrustIcon name="customers" />{customerLabel}+</span>
            <span className="text-gray-300">Happy Customers</span>
          </div>
          <div className="hidden sm:block w-px h-3 bg-gray-600" />
          <div className="flex items-center gap-1.5">
            <span className="text-sunny font-bold inline-flex items-center gap-1"><TrustIcon name="rating" />{rating.toFixed(1)}/5</span>
            <span className="text-gray-300">Average Rating</span>
          </div>
          <div className="hidden sm:block w-px h-3 bg-gray-600" />
          <div className="flex items-center gap-1.5">
            <span className="text-sunny font-bold inline-flex items-center gap-1"><TrustIcon name="delivery" />3-5</span>
            <span className="text-gray-300">Days Delivery</span>
          </div>
          <div className="hidden sm:block w-px h-3 bg-gray-600" />
          <div className="flex items-center gap-1.5">
            <span className="text-sunny font-bold inline-flex items-center gap-1"><TrustIcon name="exchange" />100%</span>
            <span className="text-gray-300">Exchange Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  )
}
