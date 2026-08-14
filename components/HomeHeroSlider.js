'use client'
import Image from 'next/image'

export default function HomeHeroSlider() {
  return (
    <section className="w-full px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl shadow-sm border border-gray-200 bg-white">
        <Image
          src="/sale-1947.png"
          alt="Kiddy Trends sale banner"
          width={1600}
          height={700}
          priority
          className="block h-auto w-full object-cover"
        />
      </div>
    </section>
  )
}