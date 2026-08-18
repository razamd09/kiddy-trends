'use client'
import { useEffect, useRef, useState } from 'react'

// Wraps heavy embeds (TikTok/Instagram iframes) so they don't get created in
// the DOM at all until the user scrolls near them. Native `loading="lazy"` on
// an <iframe> only defers the iframe's own network request — the iframe
// element itself, and Next's hydration cost for it, still happens immediately.
// This wrapper avoids mounting the iframe entirely until it's needed.
//
// Usage:
//   <LazyMount minHeight={560}>
//     <iframe src="..." ... />
//   </LazyMount>

export default function LazyMount({ children, minHeight = 400, rootMargin = '300px' }) {
    const [shouldRender, setShouldRender] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        if (shouldRender) return
        const node = ref.current
        if (!node || typeof IntersectionObserver === 'undefined') {
            setShouldRender(true)
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setShouldRender(true)
                    observer.disconnect()
                }
            },
            { rootMargin }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [shouldRender, rootMargin])

    if (shouldRender) return children

    return (
        <div
            ref={ref}
            className="rounded-xl bg-gray-100 animate-pulse"
            style={{ minHeight }}
        />
    )
}
