'use client'
import { useState, useEffect } from 'react'

const notifications = [
  { name: 'Sara A.',     city: 'Lahore',      product: 'Girls Summer Frock',        time: '2 mins ago' },
  { name: 'Fatima K.',   city: 'Karachi',     product: 'Boys Branded Pack',         time: '5 mins ago' },
  { name: 'Nadia M.',    city: 'Islamabad',   product: 'Kids Bedding Set',          time: '8 mins ago' },
  { name: 'Ayesha R.',   city: 'Faisalabad',  product: 'School Bag Pack',           time: '12 mins ago' },
  { name: 'Hina S.',     city: 'Multan',      product: 'Newborn Gift Set',          time: '15 mins ago' },
  { name: 'Zara T.',     city: 'Rawalpindi',  product: 'Girls Hair Accessories',    time: '18 mins ago' },
  { name: 'Sana B.',     city: 'Peshawar',    product: 'Boys Summer Collection',    time: '20 mins ago' },
  { name: 'Amna Q.',     city: 'Gujranwala',  product: 'Toddler Outfit Set',        time: '22 mins ago' },
  { name: 'Rabia N.',    city: 'Sialkot',     product: 'Kids Clothing Pack',        time: '25 mins ago' },
  { name: 'Uzma F.',     city: 'Quetta',      product: 'Baby Clothes Bundle',       time: '28 mins ago' },
  { name: 'Maham J.',    city: 'Hyderabad',   product: 'Girls Fancy Dress',         time: '30 mins ago' },
  { name: 'Bushra W.',   city: 'Bahawalpur',  product: 'Boys Trouser Shirt Set',    time: '32 mins ago' },
  { name: 'Shazia K.',   city: 'Sahiwal',     product: 'Kids Winter Collection',    time: '35 mins ago' },
  { name: 'Mehwish T.',  city: 'Lahore',      product: 'Toddler Summer Pack',       time: '38 mins ago' },
  { name: 'Iqra S.',     city: 'Karachi',     product: 'Girls Accessories Set',     time: '40 mins ago' },
]

export default function LiveNotifications() {
  const [current, setCurrent] = useState(null)
  const [visible, setVisible] = useState(false)
  const [index, setIndex]     = useState(0)

  useEffect(() => {
    // Start after 5 seconds
    const startTimer = setTimeout(() => tick(), 10000)
    return () => clearTimeout(startTimer)
  }, [])

  function showNext(idx) {
    const notification = notifications[idx % notifications.length]
    setCurrent(notification)
    setVisible(true)

    // Hide after 4 seconds
    const hideTimer = setTimeout(() => {
      setVisible(false)
      // Show next after 8 seconds gap
      const nextTimer = setTimeout(() => {
        showNext(idx + 1)
      }, 8000)
      return () => clearTimeout(nextTimer)
    }, 4000)
    return () => clearTimeout(hideTimer)
  }

  if (!current) return null

  return (
    <div className={`fixed bottom-24 left-4 z-40 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 flex items-center gap-3 max-w-xs">
        <div className="w-10 h-10 bg-coral/20 rounded-full flex items-center justify-center flex-shrink-0 font-display text-coral text-base">
          {current.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-charcoal truncate">
            {current.name} from {current.city}
          </p>
          <p className="text-xs text-gray-500 truncate">
            Just ordered <span className="text-coral font-semibold">{current.product}</span>
          </p>
          <p className="text-xs text-gray-400">{current.time}</p>
        </div>
        <span className="text-lg flex-shrink-0">🛍️</span>
      </div>
    </div>
  )
}