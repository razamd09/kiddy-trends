'use client'
import Link from 'next/link'

// Replaces the old 3-slide carousel (winter/free-shipping/summer messages)
// with a single looping background video, kept at the same width/height
// footprint the carousel used to occupy so nothing else on the page shifts.
// Hosted on Supabase's public "site-assets" bucket (not Vercel) so this
// never expires like the 30-day signed product-image URLs, and doesn't add
// to Vercel's own Origin Transfer/Function usage on every homepage view —
// see the image-serving fix in app/api/products/route.js for the same
// reasoning. autoPlay+muted+playsInline is required for browsers to allow
// autoplay at all; preload="auto" so it starts playing immediately rather
// than buffering after appearing.
const HERO_VIDEO_URL = 'https://jblksspdfcefooikznao.supabase.co/storage/v1/object/public/site-assets/hero/winter-hero.mp4'

export default function HomeHeroSlider() {
  return (
    <div className="relative w-full min-h-[560px] sm:min-h-[620px] md:min-h-[680px] lg:min-h-[760px] overflow-hidden"
         style={{ background: 'linear-gradient(180deg, #eef5fb 0%, #dbe9f5 100%)' }}>
      {/* object-contain (not cover) — the source video's own aspect ratio
          doesn't match this wide/short banner shape, and cover was cropping
          the top of the frame off. contain shows the whole video, letterboxed
          into the surrounding gradient instead of cut off. */}
      <video
        src={HERO_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-contain"
      />

      <div className="absolute inset-x-0 bottom-8 md:bottom-12 flex justify-center z-10">
        <Link
          href="/collections?season=Winter"
          className="rounded-full font-display text-base px-8 py-4 shadow-lg hover:scale-105 transition-transform"
          style={{ background: '#1f3a52', color: '#ffffff' }}
        >
          Shop Winter Collection
        </Link>
      </div>
    </div>
  )
}
