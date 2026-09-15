'use client'
import { useState, useEffect } from 'react'
import ProductCard from '../../components/ProductCard'
import Link from 'next/link'

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([])
  const [phone, setPhone] = useState('')
  const [linkedPhone, setLinkedPhone] = useState('')
  const [syncStatus, setSyncStatus] = useState('idle') // idle | loading | success | error
  const [syncMessage, setSyncMessage] = useState('')

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setWishlist(stored)
      const savedPhone = localStorage.getItem('wishlist_phone') || ''
      setLinkedPhone(savedPhone)
    } catch {}
  }, [])

  async function handleSync(e) {
    e.preventDefault()
    if (syncStatus === 'loading') return
    const trimmed = phone.trim()
    if (!trimmed) {
      setSyncStatus('error')
      setSyncMessage('Please enter your phone number')
      return
    }
    setSyncStatus('loading')
    try {
      const res = await fetch('/api/wishlist?phone=' + encodeURIComponent(trimmed))
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Something went wrong')

      const remoteProducts = data.products || []
      const localProducts = JSON.parse(localStorage.getItem('wishlist') || '[]')

      const merged = [...localProducts]
      remoteProducts.forEach((remoteProduct) => {
        if (!merged.some((p) => p.id === remoteProduct.id)) merged.push(remoteProduct)
      })

      if (merged.length > 0) {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: trimmed, products: merged }),
        })
      }

      localStorage.setItem('wishlist', JSON.stringify(merged))
      localStorage.setItem('wishlist_phone', trimmed)
      setWishlist(merged)
      setLinkedPhone(trimmed)
      setPhone('')
      setSyncStatus('success')
      setSyncMessage('Your wishlist is now synced across devices!')
    } catch (err) {
      setSyncStatus('error')
      setSyncMessage(err.message || 'Something went wrong, please try again')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="section-title mb-3">My Wishlist 💝</h1>
        <p className="text-gray-500">Products you saved for later</p>
      </div>

      <div className="max-w-md mx-auto mb-10 bg-cream rounded-2xl p-5">
        {linkedPhone ? (
          <p className="text-sm text-center text-charcoal">
            ✅ Synced to <strong>{linkedPhone}</strong> — your wishlist will follow you across devices.
          </p>
        ) : (
          <>
            <p className="text-sm text-center text-charcoal font-semibold mb-3">Save your wishlist across devices</p>
            <form onSubmit={handleSync} className="flex gap-2">
              <input type="tel" placeholder="03XX-XXXXXXX" value={phone}
                onChange={(e) => { setPhone(e.target.value); if (syncStatus !== 'idle') setSyncStatus('idle') }}
                className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-coral bg-white" />
              <button type="submit" disabled={syncStatus === 'loading'}
                className="btn-primary text-sm whitespace-nowrap disabled:opacity-60">
                {syncStatus === 'loading' ? 'Syncing…' : 'Sync'}
              </button>
            </form>
            {syncMessage && (
              <p className={'mt-2 text-xs text-center font-semibold ' + (syncStatus === 'error' ? 'text-red-500' : 'text-mint')}>
                {syncMessage}
              </p>
            )}
          </>
        )}
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
