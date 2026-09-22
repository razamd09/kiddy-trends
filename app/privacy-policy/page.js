export const metadata = {
  title: 'Privacy Policy | Kiddy Trends',
  description: 'How Kiddy Trends collects, uses, and protects your information.',
}

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block bg-sunny text-charcoal font-display text-sm px-4 py-1.5 rounded-full mb-4">
          Your Privacy Matters
        </span>
        <h1 className="section-title mb-4">Privacy Policy</h1>
        <p className="text-gray-500 text-lg">
          This explains what information Kiddy Trends collects, how it's used, and how it's protected.
        </p>
      </div>

      {/* Policy sections */}
      <div className="space-y-5">

        <div className="bg-skyblue/20 rounded-3xl p-7">
          <div className="flex items-start gap-4">
            <span className="text-3xl mt-1">📋</span>
            <div>
              <h2 className="font-display text-2xl text-charcoal mb-2">Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed">
                When you place an order or contact us, we collect your name, phone number, delivery
                address, city, and (if provided) email address, along with details of what you
                ordered and the payment method. If you message us on WhatsApp or Instagram to place
                or discuss an order, we also keep a record of that conversation.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-sunny/30 rounded-3xl p-7">
          <div className="flex items-start gap-4">
            <span className="text-3xl mt-1">💬</span>
            <div>
              <h2 className="font-display text-2xl text-charcoal mb-2">Messages on Instagram &amp; WhatsApp</h2>
              <p className="text-gray-600 leading-relaxed">
                If you message our shop on Instagram or WhatsApp, we may read that conversation —
                including using an AI assistant to automatically read out details like your name,
                phone number, address, and what you ordered — solely to process and ship your order
                faster and more accurately. This is never used for anything else: not for marketing,
                not for ad targeting, and not shared with anyone outside of fulfilling your order.
                A member of our team always reviews these details before anything is booked with our
                courier.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-mint/20 rounded-3xl p-7">
          <div className="flex items-start gap-4">
            <span className="text-3xl mt-1">🎯</span>
            <div>
              <h2 className="font-display text-2xl text-charcoal mb-2">How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed">
                We use your information to process and deliver your order, provide customer support,
                send order-status updates (email and WhatsApp), and — only if you've opted in — send
                occasional promotions about new arrivals. We never sell your personal information to
                third parties.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-coral/15 rounded-3xl p-7">
          <div className="flex items-start gap-4">
            <span className="text-3xl mt-1">🔗</span>
            <div>
              <h2 className="font-display text-2xl text-charcoal mb-2">Third-Party Services We Use</h2>
              <p className="text-gray-600 leading-relaxed">
                To run our store and deliver orders, we work with: PostEx (courier &amp; cash-on-delivery
                collection), WhatsApp Business Platform and Instagram Messaging (order updates and
                customer service), Meta Pixel/Conversions API (understanding which ads led to a
                purchase), and Supabase (secure database hosting). Each of these only receives the
                information needed to perform their part of getting your order to you.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-skyblue/15 rounded-3xl p-7">
          <div className="flex items-start gap-4">
            <span className="text-3xl mt-1">🔒</span>
            <div>
              <h2 className="font-display text-2xl text-charcoal mb-2">Data Retention &amp; Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We keep order and conversation records for as long as needed for customer service,
                accounting, and legal purposes, stored securely with access restricted to authorized
                staff. You can ask us to delete your information at any time — see contact details below.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-sunny/20 rounded-3xl p-7">
          <div className="flex items-start gap-4">
            <span className="text-3xl mt-1">👶</span>
            <div>
              <h2 className="font-display text-2xl text-charcoal mb-2">Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                Kiddy Trends sells products for children, but our customers — the people who place
                orders and message us — are parents and guardians. We do not knowingly collect
                personal information directly from children.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-mint/15 rounded-3xl p-7">
          <div className="flex items-start gap-4">
            <span className="text-3xl mt-1">✋</span>
            <div>
              <h2 className="font-display text-2xl text-charcoal mb-2">Your Rights</h2>
              <p className="text-gray-600 leading-relaxed">
                You can ask us what information we hold about you, request a correction, or ask us to
                delete it, by contacting us using the details below. We'll respond as quickly as we can.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Contact box */}
      <div className="mt-10 bg-coral rounded-3xl p-8 text-white text-center">
        <div className="text-4xl mb-3">💬</div>
        <h3 className="font-display text-2xl mb-2">Questions about your privacy?</h3>
        <p className="text-white/80 mb-5">Reach out and we'll be happy to help.</p>
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
        Policy last updated: September 2026 · Kiddy Trends reserves the right to update this policy at any time.
      </p>
    </div>
  )
}
