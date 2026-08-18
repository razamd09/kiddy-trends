'use client'
import { useEffect, useRef, useState } from 'react'

// Lightweight animated snowfall overlay. Drop it inside any `position: relative`
// container and it covers that container with falling snowflakes.
//
// Usage:
//   <div className="relative ...">
//     <Snowfall />
//     ...rest of your hero content...
//   </div>
//
// - Respects prefers-reduced-motion — shows a few static flakes instead of animating.
// - Uses fewer flakes on small screens (mobile) to save CPU/battery.
// - Pauses animation entirely once scrolled out of view via IntersectionObserver,
//   so it doesn't keep animating (and costing CPU) once you've scrolled past the hero.

export default function Snowfall({ count = 70, mobileCount = 30 }) {
    const [flakes, setFlakes] = useState([])
    const [reducedMotion, setReducedMotion] = useState(false)
    const [visible, setVisible] = useState(true)
    const containerRef = useRef(null)

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReducedMotion(mediaQuery.matches)

        const effectiveCount = window.innerWidth < 640 ? mobileCount : count
        const generated = Array.from({ length: effectiveCount }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 6 + Math.random() * 16,
            duration: 5 + Math.random() * 7,
            delay: Math.random() * 7,
            drift: -40 + Math.random() * 80,
            opacity: 0.55 + Math.random() * 0.4,
        }))
        setFlakes(generated)
    }, [count, mobileCount])

    useEffect(() => {
        const node = containerRef.current
        if (!node || typeof IntersectionObserver === 'undefined') return

        const observer = new IntersectionObserver(
            (entries) => setVisible(entries[0]?.isIntersecting ?? true),
            { threshold: 0 }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ zIndex: 2 }}
            aria-hidden="true"
        >
            {flakes.map((flake) => (
                <span
                    key={flake.id}
                    style={{
                        position: 'absolute',
                        top: '-20px',
                        left: flake.left + '%',
                        fontSize: flake.size + 'px',
                        color: 'rgba(255,255,255,0.85)',
                        opacity: flake.opacity,
                        animation: reducedMotion
                            ? 'none'
                            : `kt-snowfall ${flake.duration}s linear ${flake.delay}s infinite`,
                        animationPlayState: visible ? 'running' : 'paused',
                        transform: reducedMotion ? `translateY(${Math.random() * 300}px)` : undefined,
                        '--drift': flake.drift + 'px',
                    }}
                >
                    ❄
                </span>
            ))}
            <style jsx>{`
                @keyframes kt-snowfall {
                    0% {
                        transform: translateY(0) translateX(0);
                    }
                    100% {
                        transform: translateY(420px) translateX(var(--drift));
                    }
                }
            `}</style>
        </div>
    )
}
