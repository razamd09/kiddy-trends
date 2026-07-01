export default function SummerBanner({ discountCode = 'SUMMER50', href = '/collections' }) {
  return (
    <section
      role="region"
      aria-label="Summer Sale banner"
      className="relative w-full overflow-hidden bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white"
    >
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">Summer Sale</h2>
          <p className="mt-2 text-lg md:text-2xl">Up to <span className="font-black">50% OFF</span></p>
          <div className="mt-4 inline-flex items-center gap-3">
            <span className="bg-white/20 px-3 py-1 rounded text-sm md:text-base">Use code:</span>
            <span className="bg-white text-black px-3 py-1 rounded font-semibold tracking-wide">{discountCode}</span>
          </div>
        </div>

        <a
          href={href}
          className="mt-4 md:mt-0 inline-flex items-center justify-center bg-white text-black font-semibold px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition-transform"
          aria-label="Shop now — all collections"
        >
          Shop now — all collections
        </a>
      </div>

      {/* decorative circle */}
      <svg className="pointer-events-none absolute right-0 top-0 -translate-y-12 opacity-20 w-64 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#000" stopOpacity="0"/></linearGradient></defs>
        <circle cx="100" cy="100" r="80" fill="url(#g)"/>
      </svg>
    </section>
  )
}
