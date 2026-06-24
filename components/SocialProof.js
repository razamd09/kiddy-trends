'use client'
import { useState, useEffect } from 'react'

const instagramPosts = [
  { id: 1, url: 'https://www.instagram.com/trenydkids.2020/', image: 'https://source.unsplash.com/300x300/?kids,fashion,pakistan', caption: 'New arrivals! 🎉' },
]

export default function SocialProof() {
  const [count, setCount] = useState(0)
  const target = 847

  useEffect(() => {
    // Animate counter
    let start = 0
    const duration = 2000
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [])

  return null
}