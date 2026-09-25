'use client'
import { useEffect, useState } from 'react'
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
const HERO_VIDEO_URLS = [
  'https://jblksspdfcefooikznao.supabase.co/storage/v1/object/public/site-assets/hero/winter-hero.mp4',
  'https://jblksspdfcefooikznao.supabase.co/storage/v1/object/public/site-assets/hero/winter-hero-2.mp4',
]

export default function HomeHeroSlider() {
  // Starts null (renders just the gradient background, no video yet) and
  // picks randomly only after mount — picking randomly during render would
  // make the server-rendered HTML and the client's first render disagree
  // (SSR runs once, hydration runs again independently), which React flags
  // as a hydration mismatch. Deferring to useEffect means server and client
  // agree on "nothing yet" first, then the client alone picks which video —
  // one video at a time, never both, chosen fresh on each page load.
  const [videoUrl, setVideoUrl] = useState(null)

  useEffect(() => {
    setVideoUrl(HERO_VIDEO_URLS[Math.floor(Math.random() * HERO_VIDEO_URLS.length)])
  }, [])

  return (
    <div className="relative w-full min-h-[560px] sm:min-h-[620px] md:min-h-[680px] lg:min-h-[760px] overflow-hidden"
         style={{ background: 'linear-gradient(180deg, #eef5fb 0%, #dbe9f5 100%)' }}>
      {videoUrl && (
        <>
          {/* The source video is portrait — object-contain (below) shows the
              whole frame with no cropping, but on a wide desktop viewport that
              leaves big empty gaps on either side. This blurred, scaled-up copy
              of the SAME video fills those gaps as a backdrop instead of plain
              background color, which is what a portrait video needs to look
              intentional in a wide banner rather than just small in the middle.
              md+ only — on mobile the video already fills the narrower viewport
              width, so a second decoded video would only cost battery/CPU for
              no visible benefit. */}
          <video
            key={'bg-' + videoUrl}
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            className="hidden md:block absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60"
          />
          <div className="hidden md:block absolute inset-0 bg-black/10" />

          {/* object-contain (not cover) — cover was cropping the top of the
              frame off. contain shows the whole video, letterboxed into the
              backdrop above (desktop) or the plain gradient (mobile) instead. */}
          <video
            key={'fg-' + videoUrl}
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 z-[1] w-full h-full object-contain"
          />
        </>
      )}

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
