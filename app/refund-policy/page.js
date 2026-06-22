const sections = [
  {
    emoji: '↩️',
    title: '7-Day Return Window',
    color: 'bg-skyblue/20',
    content: `We accept returns within 7 days of delivery. If you're not completely happy with your purchase, reach out to us and we'll make it right. Items must be unused, unwashed, and in their original packaging with tags intact.`,
  },
  {
    emoji: '🔄',
    title: 'Exchange Policy',
    color: 'bg-sunny/30',
    content: `Want a different size or colour? We love exchanges! Simply contact our team within 7 days, send the item back, and we'll dispatch the replacement as soon as we receive it. Exchanges are subject to stock availability.`,
  },
  {
    emoji: '💸',
    title: 'Refund Process',
    color: 'bg-mint/20',
    content: `Once we receive and inspect your return, we'll process your refund within 3–5 business days. Refunds are issued to the original payment method. For Cash-on-Delivery orders, refunds are processed via bank transfer — please provide your account details when requesting.`,
  },
  {
    emoji: '🚫',
    title: 'Non-Returnable Items',
    color: 'bg-coral/15',
    content: `For hygiene reasons, the following items cannot be returned or exchanged: innerwear, socks, and swimwear. Items that are washed, worn, damaged, or missing original packaging are also not eligible for return.`,
  },
  {
    emoji: '📦',
    title: 'Damaged or Wrong Items',
    color: 'bg-lavender/20',
    content: `Received a damaged or incorrect item? We're so sorry! Please WhatsApp us within 48 hours of delivery with a photo of the item. We'll arrange a free return and send you the correct item at no extra cost.`,
  },
  {
    emoji: '🚚',
    title: 'Return Shipping',
    color: 'bg-skyblue/15',
    content: `For returns or exchanges due to our error, we cover the shipping cost. For size exchanges or change-of-mind returns, the customer is responsible for shipping charges.`,
  },
]

export default function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block bg-sunny text-charcoal font-display text-sm px-4 py-1.5 rounded-full mb-4">
          Hassle-Free Shopping
        </span>
        <h1 className="section-title mb-4">Refund & Return Policy</h1>
        <p className="text-gray-500 text-lg">
          We want you to love every Kiddy Trends purchase. Here's everything you need to know.
        </p>
      </div>

      {/* Policy cards */}
      <div className="space-y-5">
        {sections.map(s => (
          <div key={s.title} className={`${s.color} rounded-3xl p-7`}>
            <div className="flex items-start gap-4">
              <span className="text-3xl mt-1">{s.emoji}</span>
              <div>
                <h2 className="font-display text-2xl text-charcoal mb-2">{s.title}</h2>
                <p className="text-gray-600 leading-relaxed">{s.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contact box */}
      <div className="mt-10 bg-coral rounded-3xl p-8 text-white text-center">
        <div className="text-4xl mb-3">💬</div>
        <h3 className="font-display text-2xl mb-2">Need help with a return?</h3>
        <p className="text-white/80 mb-5">Our team is here to help — reach out and we'll sort it out!</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="mailto:returns@kiddytrends.com"
            className="bg-white text-coral font-semibold px-6 py-3 rounded-full hover:scale-105 transition-transform">
            ✉ Email Us
          </a>
          <a href="https://wa.me/923000000000"
            className="bg-white/20 text-white border-2 border-white font-semibold px-6 py-3 rounded-full hover:bg-white hover:text-coral transition-all">
            📱 WhatsApp
          </a>
        </div>
      </div>

      <p className="text-center text-gray-400 text-sm mt-8">
        Policy last updated: June 2025 · Kiddy Trends reserves the right to update this policy at any time.
      </p>
    </div>
  )
}
