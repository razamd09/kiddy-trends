'use client'
import { useEffect, useState } from 'react'

// Lightweight animated snowfall overlay. Drop it inside any `position: relative`
// container and it covers that container with falling snowflakes.
//
// Usage:
//   <div className="relative ...">
//     <Snowfall />
//     ...rest of your hero content...
//   </div>
//
// Respects prefers-reduced-motion — shows a few static flakes instead of
// animating, for users who've asked their OS to reduce motion.

export default function Snowfall({ count = 28 }) {
    const [flakes, setFlakes] = useState([])
    const [reducedMotion, setReducedMotion] = useState(false)

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReducedMotion(mediaQuery.matches)

        const generated = Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 8 + Math.random() * 10,
            duration: 7 + Math.random() * 8,
            delay: Math.random() * 8,
            drift: -20 + Math.random() * 40,
            opacity: 0.5 + Math.random() * 0.4,
        }))
        setFlakes(generated)
    }, [count])

    return (
        <div
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
