import Link from 'next/link'

export const metadata = {
  title: 'Frequently Asked Questions | Kiddy Trends',
  description: 'Shipping, Cash on Delivery, returns & exchanges, sizing, order tracking and rewards — answers to common questions about shopping at Kiddy Trends.',
  alternates: { canonical: '/faq' },
}

const faqs = [
  {
    q: 'Do you offer Cash on Delivery (COD)?',
    a: 'Yes! Cash on Delivery is available across Pakistan on every order — pay when your package arrives at your door.',
  },
  {
    q: 'How much does shipping cost?',
    a: 'Shipping is a flat PKR 250 across Pakistan, regardless of order size. If you place 3 or more orders in the same month, delivery becomes free on your next orders that month as a loyalty perk.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Orders are typically delivered within 3-5 business days across Pakistan.',
  },
  {
    q: 'Can I return or exchange an item?',
    a: 'We offer a free exchange if an item arrives damaged, in the wrong size, or if the wrong article was delivered — just contact us within 7 days of delivery with a photo and your order number. Items must be unused, unwashed, and with tags intact. We do not offer exchanges for change-of-mind purchases. See our full Return & Exchange Policy for details.',
  },
  {
    q: 'How do I track my order?',
    a: 'Use our Order Tracking page and enter your order number to see live status updates, from processing to delivered.',
  },
  {
    q: 'What sizes do you offer?',
    a: 'We stock sizes from newborn (0-3 months) all the way up to 12 years. Check our Size Chart for detailed measurements before ordering, or use the built-in size recommender on any product page.',
  },
  {
    q: 'How does the Kiddy Trends Rewards program work?',
    a: 'Every order earns you reward points based on how much you spend, tracked automatically against your phone number — no signup needed. Points can be redeemed as a cash discount on a future order at checkout.',
  },
  {
    q: 'How can I contact you?',
    a: 'The fastest way to reach us is WhatsApp at 0336 0677340. You can also email us at thekiddytrends@gmail.com or use our Feedback page.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

export default function FaqPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="text-center mb-12">
        <span className="inline-block bg-sunny text-charcoal font-display text-sm px-4 py-1.5 rounded-full mb-4">
          We're Here to Help
        </span>
        <h1 className="section-title mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-500 text-lg">Everything you need to know about shopping at Kiddy Trends.</p>
      </div>

      <div className="space-y-3">
        {faqs.map((item, i) => (
          <details key={i} className="group bg-cream rounded-2xl p-5 open:shadow-sm">
            <summary className="font-display text-lg text-charcoal cursor-pointer list-none flex items-center justify-between gap-4">
              {item.q}
              <span className="text-coral text-xl flex-shrink-0 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="text-gray-600 leading-relaxed mt-3">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-10 bg-coral rounded-3xl p-8 text-white text-center">
        <div className="text-4xl mb-3">💬</div>
        <h3 className="font-display text-2xl mb-2">Still have a question?</h3>
        <p className="text-white/80 mb-5">We usually reply within minutes on WhatsApp!</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="https://wa.me/923360677340" target="_blank" rel="noopener noreferrer"
            className="bg-white text-coral font-semibold px-6 py-3 rounded-full hover:scale-105 transition-transform">
            📱 WhatsApp Us
          </a>
          <Link href="/feedback"
            className="bg-white/20 text-white border-2 border-white font-semibold px-6 py-3 rounded-full hover:bg-white hover:text-coral transition-all">
            Share Feedback
          </Link>
        </div>
      </div>
    </div>
  )
}
