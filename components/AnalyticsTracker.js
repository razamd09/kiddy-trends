'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { hasLandingBeenSent, markLandingSent, trackEvent } from '../lib/analyticsClient'
import { captureUtmParams } from '../lib/utmCapture'

export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    captureUtmParams()
  }, [pathname])

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
