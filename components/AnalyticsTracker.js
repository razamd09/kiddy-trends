'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { hasLandingBeenSent, markLandingSent, trackEvent } from '../lib/analyticsClient'

export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!hasLandingBeenSent()) {
      trackEvent('landing', { path: pathname || '/' })
      markLandingSent()
    }
  }, [])

  useEffect(() => {
    if (!pathname) return
    trackEvent('page_view', { path: pathname })
  }, [pathname])

  return null
}
