'use client'
import { useState } from 'react'
import { useCart } from '../context/CartContext'
import CheckoutModal from './CheckoutModal'



export default function CartDrawer() {
const [emailInput, setEmailInput]     = useState('')
const [abandonEmail, setAbandonEmail] = useState('')

function handleSaveEmail() {
  if (!emailInput.includes('@')) return
  setAbandonEmail(emailInput)
  localStorage.setItem('cart_email', emailInput)
}

  const { cart, cartOpen, setCartOpen, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)
  return (
    <>
      {cartOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setCartOpen(false)} />
      )}

      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl text-charcoal">Your Cart</h2>
            {totalItems > 0 && (
              <span className="bg-coral text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <button onClick={() => setCartOpen(false)}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-coral hover:text-white transition-colors flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Empty */}
        {cart.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="text-7xl mb-4">🛒</div>
            <h3 className="font-display text-2xl text-charcoal mb-2">Your cart is empty</h3>
            <p className="text-gray-400 mb-6">Add some cute items for your little one!</p>
            <button onClick={() => setCartOpen(false)} className="btn-primary">
              Continue Shopping
            </button>
          </div>
        )}

        {/* Items */}
        {cart.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.map(item => (
                <div key={item.variantId} className="flex gap-4 bg-cream rounded-2xl p-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white flex-shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-contain mix-blend-multiply p-1" />
                    ) : (
                      <span className="text-3xl">👕</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display text-sm text-charcoal leading-tight line-clamp-2">{item.title}</h4>
                    {item.variantTitle && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.variantTitle}</p>
                    )}
                    <p className="text-coral font-bold text-sm mt-1">
                      PKR {(item.price * item.quantity).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="w-7 h-7 rounded-full bg-white border border-gray-200 hover:bg-coral hover:text-white hover:border-coral transition-colors flex items-center justify-center text-sm font-bold">
                        −
                      </button>
                      <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                     <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
  disabled={item.quantity >= 2}
  className={`w-7 h-7 rounded-full border transition-colors flex items-center justify-center text-sm font-bold ${item.quantity >= 2 ? 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border-gray-200 hover:bg-coral hover:text-white hover:border-coral'}`}>
  +
</button>
                      <button onClick={() => removeFromCart(item.variantId)}
                        className="ml-auto text-gray-300 hover:text-coral transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg text-charcoal">Total</span>
                <span className="font-display text-2xl text-coral">PKR {totalPrice.toLocaleString()}</span>
              </div>
              <button onClick={() => setShowCheckout(true)}
  className="w-full bg-coral text-white font-display text-lg py-4 rounded-2xl hover:bg-opacity-90 transition-all hover:scale-[1.02] active:scale-95 shadow-md block text-center">
  
  {/* Abandoned cart email capture */}
{cart.length > 0 && !abandonEmail && (
  <div className="px-4 pb-3">
    <div className="bg-sunny/20 rounded-2xl p-3 flex gap-2">
      <input type="email" placeholder="Email for order updates..."
        value={emailInput} onChange={e => setEmailInput(e.target.value)}
        className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-coral bg-white" />
      <button onClick={handleSaveEmail}
        className="text-xs bg-coral text-white px-3 py-2 rounded-xl font-bold hover:bg-opacity-90">
        Save
      </button>
    </div>
    <p className="text-xs text-gray-400 mt-1 text-center">Get notified about your cart</p>
  </div>
)}
  Checkout 🛍️
</button>
              <button onClick={() => setCartOpen(false)}
                className="w-full border-2 border-gray-200 text-charcoal font-display text-base py-3 rounded-2xl hover:border-coral hover:text-coral transition-colors">
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
{showCheckout && (
        <CheckoutModal
          isCart={true}
          cartItems={cart}
          totalPrice={totalPrice}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </>
  )
}