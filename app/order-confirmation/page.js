
'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function OrderConfirmationContent() {
    const searchParams  = useSearchParams()
    const orderNumber   = searchParams.get('order')
    const customerName  = searchParams.get('name')
    const total         = searchParams.get('total')
    const [count, setCount] = useState(5)

    useEffect(() => {
        const timer = setInterval(() => {
            setCount(c => {
                if (c <= 1) { clearInterval(timer); return 0 }
                return c - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center">

                {/* Success animation */}
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce2">
                    <span className="text-5xl">🎉</span>
                </div>

                <h1 className="font-display text-3xl text-charcoal mb-2">Order Placed!</h1>
                <p className="text-gray-500 mb-6">Thank you {customerName}! Your order has been confirmed.</p>

                {/* Order number */}
                <div className="bg-coral/10 rounded-2xl p-5 mb-6">
                    <p className="text-sm text-gray-500 mb-1">Your Order Number</p>
                    <p className="font-display text-4xl text-coral">{orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-1">Save this to track your order</p>
                </div>

                {/* Order details */}
                <div className="bg-cream rounded-2xl p-4 mb-6 space-y-2 text-sm text-left">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Payment</span>
                        <span className="font-semibold text-charcoal">Cash on Delivery</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Total</span>
                        <span className="font-bold text-coral">PKR {parseInt(total || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Delivery</span>
                        <span className="font-semibold text-charcoal">3-5 Business Days</span>
                    </div>
                </div>

                {/* What's next */}
                <div className="bg-skyblue/20 rounded-2xl p-4 mb-6 text-left">
                    <p className="font-display text-sm text-charcoal mb-2">What happens next?</p>
                    <ul className="space-y-1 text-xs text-gray-500">
                        <li>✅ Our team will confirm your order via WhatsApp</li>
                        <li>📦 We'll pack your items carefully</li>
                        <li>🚚 Your order will be dispatched in 1-2 days</li>
                        <li>🎉 Delivered to your door in 3-5 business days</li>
                    </ul>
                </div>

                {/* WhatsApp confirmation */}
                <a href={'https://wa.me/923360677340?text=' + encodeURIComponent(
                    'Hi Kiddy Trends! I just placed an order.\n\nOrder Number: ' + orderNumber + '\nName: ' + customerName + '\nTotal: PKR ' + total + '\n\nPlease confirm my order. Thank you!'
                )} target="_blank" rel="noopener noreferrer"
                   className="w-full bg-green-500 text-white font-display text-base py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-600 transition-colors mb-3">
                    💬 Confirm on WhatsApp
                </a>

                <Link href={'/order-tracking?order=' + orderNumber}
                      className="w-full bg-coral text-white font-display text-base py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-colors mb-3 block">
                    📦 Track My Order
                </Link>

                <Link href="/collections"
                      className="w-full border-2 border-gray-100 text-charcoal font-display text-base py-4 rounded-2xl flex items-center justify-center gap-2 hover:border-coral transition-colors block">
                    🛍️ Continue Shopping
                </Link>
            </div>
        </div>
    )
}

export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><p className="font-display text-2xl animate-pulse">Loading...</p></div>}>
            <OrderConfirmationContent />
        </Suspense>
    )
}