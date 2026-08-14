'use client'
import Image from 'next/image'
import Link from 'next/link'

export default function HomeHeroSlider() {
  return (
    <section className="w-full py-2 sm:py-3">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-[#dfe9e2] ring-1 ring-black/5">
          <Image
            src="/sale-1947.png"
            alt="Kiddy Trends sale banner"
            width={1600}
            height={700}
            priority
            className="block h-auto max-h-[300px] w-full object-contain sm:max-h-[340px] lg:max-h-[360px]"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#dfe9e2]/30 via-transparent to-[#dfe9e2]/10" />

          <Link
            href="/collections"
            className="absolute left-6 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-[#0d5b4b] px-7 py-4 text-[clamp(1.5rem,2vw,2.8rem)] font-black uppercase tracking-tight text-white shadow-[0_12px_24px_rgba(12,88,72,0.25)] transition-transform duration-200 hover:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#0d5b4b]/20 sm:left-8 sm:px-9 sm:py-5"
            aria-label="Shop the sale collection"
          >
            <span className="mr-3 inline-block h-4 w-4 rounded-full bg-[#7ce1c4] shadow-[0_0_0_4px_rgba(124,225,196,0.2)]" />
            <span>Sale Live</span>
          </Link>

          <div className="absolute right-6 top-1/2 hidden h-28 w-28 -translate-y-1/2 rounded-full bg-white/95 shadow-[0_12px_24px_rgba(0,0,0,0.04)] md:block" />
        </div>
      </div>
    </section>
  )
}