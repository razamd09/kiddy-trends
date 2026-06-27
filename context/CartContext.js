'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart]         = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('kt_cart')
    if (saved) {
      const parsed = JSON.parse(saved)
      const fixed = parsed.map(item => {
        const maxStock = Number.isFinite(Number(item.stock)) ? Number(item.stock) : Infinity
        const safeQty = Math.max(1, Number(item.quantity) || 1)
        return { ...item, quantity: Math.min(safeQty, maxStock) }
      })
      setCart(fixed)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('kt_cart', JSON.stringify(cart))
  }, [cart])

  function addToCart(product, variant) {
    setCart(prev => {
      const variantStock = Number.isFinite(Number(variant?.inventory_quantity))
        ? Number(variant.inventory_quantity)
        : (Number.isFinite(Number(product?.stock)) ? Number(product.stock) : Infinity)
      const existing = prev.find(item => item.variantId === variant.id)
      if (existing) {
        if (existing.quantity >= variantStock) return prev
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
        stock:        variantStock,
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
      const maxStock = Number.isFinite(Number(item.stock)) ? Number(item.stock) : Infinity
      return { ...item, quantity: Math.min(quantity, maxStock) }
    }))
  }

  function clearCart() { setCart([]) }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  function getCheckoutUrl() {
    if (cart.length === 0) return '#'
    const items = cart.map(item => item.variantId + ':' + item.quantity).join(',')
    return 'https://thekiddytrends.com/cart/' + items
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