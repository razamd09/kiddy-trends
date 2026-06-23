'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart]         = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('kt_cart')
    if (saved) setCart(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('kt_cart', JSON.stringify(cart))
  }, [cart])

 function addToCart(product, variant, stock = 999, trackStock = false) {
    setCart(prev => {
      const existing = prev.find(item => item.variantId === variant.id)
      if (existing) {
        // Don't exceed stock
        const maxQty = trackStock ? stock : 999
        if (existing.quantity >= maxQty) return prev
        return prev.map(item =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
    return [...prev, {
        variantId:    variant.id,
        productId:    product.id,
        title:        product.title,
        variantTitle: variant.title !== 'Default Title' ? variant.title : '',
        price:        parseFloat(variant.price),
        image:        product.images?.[0]?.src || null,
        handle:       product.handle,
        quantity:     1,
        stock:        trackStock ? stock : 999,
      }]
    })
    setCartOpen(true)
  }

  function removeFromCart(variantId) {
    setCart(prev => prev.filter(item => item.variantId !== variantId))
  }

  function updateQuantity(variantId, quantity) {
    if (quantity < 1) { removeFromCart(variantId); return }
    setCart(prev => prev.map(item => {
      if (item.variantId !== variantId) return item
      const maxQty = item.stock || 999
      return { ...item, quantity: Math.min(quantity, maxQty) }
    }))
  }

  function clearCart() { setCart([]) }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  function getCheckoutUrl() {
    if (cart.length === 0) return '#'
    const items = cart.map(item => `${item.variantId}:${item.quantity}`).join(',')
    return `https://thekiddytrends.com/cart/${items}`
  }

  return (
    <CartContext.Provider value={{
      cart, cartOpen, setCartOpen,
      addToCart, removeFromCart, updateQuantity, clearCart,
      totalItems, totalPrice, getCheckoutUrl
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}