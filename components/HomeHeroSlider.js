'use client'
import Link from 'next/link'

export default function HomeHeroSlider() {
  return (
    <section className="w-full bg-[#dfe9e2] py-3 sm:py-4">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="relative flex justify-center md:justify-start">
          <div className="absolute right-0 top-1/2 hidden h-36 w-36 -translate-y-1/2 rounded-full bg-white/80 md:block" />

          <Link
            href="/collections"
            className="group relative inline-flex items-center justify-center rounded-full bg-[#0c5848] px-8 py-4 text-[clamp(1.5rem,2vw,3rem)] font-black uppercase tracking-tight text-white shadow-[0_10px_24px_rgba(12,88,72,0.25)] transition-transform duration-200 hover:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#0c5848]/20 sm:px-10 sm:py-5"
            aria-label="Shop the sale collection"
          >
            <span className="mr-3 inline-block h-4 w-4 rounded-full bg-[#7ce1c4] shadow-[0_0_0_4px_rgba(124,225,196,0.2)]" />
            <span>Sale Live</span>
          </Link>
        </div>
      </div>
    </section>
  )
}