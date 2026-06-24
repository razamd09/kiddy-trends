export default function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block bg-sunny text-charcoal font-display text-sm px-4 py-1.5 rounded-full mb-4">
          Your Satisfaction is Our Priority
        </span>
        <h1 className="section-title mb-4">Return & Exchange Policy</h1>
        <p className="text-gray-500 text-lg">
          At Kiddy Trends, we stand behind the quality of every product we sell.
        </p>
      </div>

      {/* Policy sections */}
      <div className="space-y-5">

        <div className="bg-skyblue/20 rounded-3xl p-7">
          <div className="flex items-start gap-4">
            <span className="text-3xl mt-1">🛡️</span>
            <div>
              <h2 className="font-display text-2xl text-charcoal mb-2">Our Quality Guarantee</h2>
              <p className="text-gray-600 leading-relaxed">
                At Kiddy Trends, we take full responsibility for the quality of every item we deliver.
                If you receive a damaged, defective, or incorrect article, we will arrange a
                free exchange at absolutely no cost to you. Your trust means everything to us,
                and we will always make it right.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-sunny/30 rounded-3xl p-7">
          <div className="flex items-start gap-4">
            <span className="text-3xl mt-1">📦</span>
            <div>
              <h2 className="font-display text-2xl text-charcoal mb-2">Damaged Items</h2>
              <p className="text-gray-600 leading-relaxed">
                In the rare event that your order arrives damaged or in poor condition,
                please contact us within 48 hours of receiving your delivery. Simply send
                us a clear photo of the damaged item via WhatsApp or email, and we will
                immediately arrange a free replacement. We ensure every item is carefully
                packed before dispatch, but we understand that transit issues can sometimes occur.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-mint/20 rounded-3xl p-7">
          <div className="flex items-start gap-4">
            <span className="text-3xl mt-1">📏</span>
            <div>
              <h2 className="font-display text-2xl text-charcoal mb-2">Wrong Size Delivered</h2>
              <p className="text-gray-600 leading-relaxed">
                If the size delivered does not match what you ordered, we take complete
                responsibility for the error. Please contact our team within 7 days of
                delivery with your order details and a photo of the item received. We will
                arrange a free pickup and deliver the correct size to you at no additional
                charge. We recommend referring to our size chart before placing an order
                to ensure the best fit for your child.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-coral/15 rounded-3xl p-7">
          <div className="flex items-start gap-4">
            <span className="text-3xl mt-1">🔄</span>
            <div>
              <h2 className="font-display text-2xl text-charcoal mb-2">Wrong Article Delivered</h2>
              <p className="text-gray-600 leading-relaxed">
                If you receive a completely different product than what you ordered, we sincerely
                apologize for the inconvenience. This is our error and we will resolve it
                immediately. Contact us within 7 days with a photo of the wrong item and your
                order number. We will arrange a free exchange and ensure the correct product
                reaches you as quickly as possible, with priority shipping at no cost to you.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-skyblue/15 rounded-3xl p-7">
          <div className="flex items-start gap-4">
            <span className="text-3xl mt-1">⏱️</span>
            <div>
              <h2 className="font-display text-2xl text-charcoal mb-2">Exchange Timeline</h2>
              <p className="text-gray-600 leading-relaxed">
                Once your exchange request is approved and the item is picked up,
                the replacement will be dispatched within 2-3 business days.
                You will receive a WhatsApp confirmation once your replacement order
                is on its way. Our goal is to resolve every exchange within 5-7 business
                days from the date of your request, ensuring minimal inconvenience to you
                and your family.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-sunny/20 rounded-3xl p-7">
          <div className="flex items-start gap-4">
            <span className="text-3xl mt-1">📋</span>
            <div>
              <h2 className="font-display text-2xl text-charcoal mb-2">Conditions for Exchange</h2>
              <p className="text-gray-600 leading-relaxed">
                To be eligible for a free exchange, items must be unused, unwashed,
                and in their original packaging with all tags intact. Exchanges are only
                applicable for damaged articles, wrong sizes, or incorrect items delivered
                by our team. We do not offer exchanges or refunds for change-of-mind purchases.
                All exchange requests must be submitted within 7 days of delivery with
                photographic evidence.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Contact box */}
      <div className="mt-10 bg-coral rounded-3xl p-8 text-white text-center">
        <div className="text-4xl mb-3">💬</div>
        <h3 className="font-display text-2xl mb-2">Need to raise an exchange request?</h3>
        <p className="text-white/80 mb-5">Contact us and we'll sort it out right away!</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="mailto:thekiddytrends@gmail.com"
            className="bg-white text-coral font-semibold px-6 py-3 rounded-full hover:scale-105 transition-transform">
            ✉ thekiddytrends@gmail.com
          </a>
          <a href="https://wa.me/923360677340"
            className="bg-white/20 text-white border-2 border-white font-semibold px-6 py-3 rounded-full hover:bg-white hover:text-coral transition-all">
            📱 WhatsApp Us
          </a>
        </div>
      </div>

      <p className="text-center text-gray-400 text-sm mt-8">
        Policy last updated: June 2026 · Kiddy Trends reserves the right to update this policy at any time.
      </p>
    </div>
  )
}
