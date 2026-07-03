'use client'
import { useState, useEffect } from 'react'
import LogoLoader from './LogoLoader'

// Full-screen branded splash shown on the initial page load, then fades out.
// Lives in the root layout (which does not remount on client navigation), so it
// appears once per full load rather than on every internal route change.
export default function SplashScreen() {
    const [hidden, setHidden]   = useState(false)
    const [removed, setRemoved] = useState(false)

    useEffect(() => {
        // Keep it visible briefly so the animation reads, then fade out — or as
        // soon as the window finishes loading, whichever gives a smooth exit.
        const minTimer = setTimeout(() => setHidden(true), 1400)

        function onLoad() { setTimeout(() => setHidden(true), 300) }
        if (document.readyState !== 'complete') {
            window.addEventListener('load', onLoad)
        }
        return () => {
            clearTimeout(minTimer)
            window.removeEventListener('load', onLoad)
        }
    }, [])

    useEffect(() => {
        if (!hidden) return
        const t = setTimeout(() => setRemoved(true), 500) // matches fade duration
        return () => clearTimeout(t)
    }, [hidden])

    if (removed) return null

    return (
        <div className={'fixed inset-0 z-[9999] flex items-center justify-center bg-cream transition-opacity duration-500 ' +
            (hidden ? 'opacity-0 pointer-events-none' : 'opacity-100')}>
            <LogoLoader />
        </div>
    )
}
