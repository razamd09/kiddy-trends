'use client'
import { useState, useEffect } from 'react'

export default function WishlistButton({ product }) {
  const [wishlisted, setWishlisted] = useState(false)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setWishlisted(stored.some(p => p.id === product.id))
    } catch {}
  }, [product.id])

  function toggle(e) {
    e.preventDefault()
    e.stopPropagation()
    try {
      const stored = JSON.parse(localStorage.getItem('wishlist') || '[]')
      let updated
      if (wishlisted) {
        updated = stored.filter(p => p.id !== product.id)
      } else {
        updated = [product, ...stored].slice(0, 50)
      }
      localStorage.setItem('wishlist', JSON.stringify(updated))
      setWishlisted(!wishlisted)
    } catch {}
  }

  return (
    <button onClick={toggle}
      className={'absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ' + (wishlisted ? 'bg-coral text-white' : 'bg-white/90 text-gray-400 hover:text-coral')}>
      <svg className="w-4 h-4" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  )
}