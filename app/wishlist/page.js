'use client'
import { useState, useEffect } from 'react'
import ProductCard from '../../components/ProductCard'
import Link from 'next/link'

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setWishlist(stored)
    } catch {}
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="section-title mb-3">My Wishlist 💝</h1>
        <p className="text-gray-500">Products you saved for later</p>
      </div>
      {wishlist.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">💝</div>
          <h3 className="font-display text-2xl text-gray-400 mb-4">Your wishlist is empty</h3>
          <p className="text-gray-400 mb-6">Save products by clicking the heart icon!</p>
          <Link href="/collections" className="btn-primary">Browse Collections</Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-6 font-semibold">{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {wishlist.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </>
      )}
    </div>
  )
}