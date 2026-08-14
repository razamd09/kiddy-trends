'use client'
import Image from 'next/image'

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
        </div>
      </div>
    </section>
  )
}