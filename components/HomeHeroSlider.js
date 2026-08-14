'use client'
import Image from 'next/image'

export default function HomeHeroSlider() {
  return (
    <section className="w-full py-2 sm:py-3">
      <div className="mx-auto w-full px-0 sm:px-0 lg:px-0">
        <div className="relative overflow-hidden bg-[#dfe9e2]">
          <Image
            src="/sale-1947.png"
            alt="Kiddy Trends sale banner"
            width={1800}
            height={700}
            priority
            className="block h-auto w-full object-contain"
          />
        </div>
      </div>
    </section>
  )
}