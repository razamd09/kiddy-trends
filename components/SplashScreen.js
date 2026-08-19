'use client'
import { useEffect, useState } from 'react'
import Snowfall from './Snowfall'

// Full-page splash animation shown once per browser session on landing:
// Summer scene → spark/flash transition → Winter Arrivals reveal → fades
// into the homepage underneath. Total runtime ~3.2s.
//
// Usage: render <SplashScreen /> as the very first thing in your homepage
// (app/page.js), above everything else. It's fixed/full-screen and removes
// itself from the DOM automatically when done.

const SESSION_KEY = 'kt_winter_splash_seen'
const TOTAL_MS = 3200

export default function SplashScreen() {
    const [mounted, setMounted] = useState(false)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const alreadySeen = sessionStorage.getItem(SESSION_KEY)

        if (reducedMotion || alreadySeen) {
            setReady(true)
            return
        }

        sessionStorage.setItem(SESSION_KEY, '1')
        setMounted(true)
        setReady(true)
    }, [])

    if (!ready || !mounted) return null

    return (
        <div
            className="fixed inset-0 overflow-hidden kt-splash-wrapper"
            style={{ zIndex: 9999 }}
            onAnimationEnd={(e) => {
                if (e.animationName === 'kt-splash-exit') setMounted(false)
            }}
        >
            {/* Summer layer (underneath, stays static) */}
            <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(160deg,#ffd27a 0%,#ff9d5c 100%)' }}
            >
                <div className="kt-sun" />
            </div>

            {/* Winter layer, revealed once the flash passes */}
            <div
                className="absolute inset-0 kt-winter-layer"
                style={{ background: 'linear-gradient(160deg,#eef5fb 0%,#bcd8ec 100%)' }}
            >
                <Snowfall count={60} mobileCount={30} />
                <div
                    className="relative h-full flex flex-col items-center justify-center px-6 text-center"
                    style={{ zIndex: 5 }}
                >
                    <div className="kt-winter-text">
                        <p className="font-display" style={{ fontSize: 'clamp(28px,6vw,54px)', color: '#1f3a52', margin: 0 }}>
                            ❄ Winter Arrivals ❄
                        </p>
                        <p className="font-display" style={{ fontSize: 'clamp(16px,3vw,24px)', color: '#3a597a', marginTop: '10px' }}>
                            Available now
                        </p>
                    </div>
                </div>
            </div>

            {/* Spark / flash burst transition */}
            <div className="kt-flash" />

            <style jsx>{`
                .kt-splash-wrapper {
                    animation: kt-splash-exit ${TOTAL_MS}ms ease forwards;
                }
                .kt-sun {
                    position: absolute;
                    top: 22%;
                    left: 50%;
                    width: 140px;
                    height: 140px;
                    margin-left: -70px;
                    margin-top: -70px;
                    border-radius: 50%;
                    background: radial-gradient(circle, #fff3c4 0%, #ffcf5c 60%, transparent 75%);
                    box-shadow: 0 0 80px 40px rgba(255, 210, 100, 0.5);
                }
                .kt-winter-layer {
                    opacity: 0;
                    animation: kt-winter-reveal ${TOTAL_MS}ms ease forwards;
                }
                .kt-winter-text {
                    opacity: 0;
                    transform: scale(0.7);
                    animation: kt-text-in ${TOTAL_MS}ms ease forwards;
                }
                .kt-flash {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 300vmax;
                    height: 300vmax;
                    margin-top: -150vmax;
                    margin-left: -150vmax;
                    border-radius: 50%;
                    transform: scale(0);
                    background: radial-gradient(circle, #ffffff 0%, #ffe9a8 35%, rgba(255, 233, 168, 0) 70%);
                    animation: kt-flash-burst ${TOTAL_MS}ms ease forwards;
                    z-index: 10;
                }

                @keyframes kt-splash-exit {
                    0%, 88% {
                        opacity: 1;
                        visibility: visible;
                        pointer-events: auto;
                    }
                    100% {
                        opacity: 0;
                        visibility: hidden;
                        pointer-events: none;
                    }
                }
                @keyframes kt-winter-reveal {
                    0%, 36% { opacity: 0; }
                    46%, 100% { opacity: 1; }
                }
                @keyframes kt-text-in {
                    0%, 54% {
                        opacity: 0;
                        transform: scale(0.7);
                    }
                    66%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes kt-flash-burst {
                    0%, 26% {
                        transform: scale(0);
                        opacity: 0;
                    }
                    34% {
                        transform: scale(0.15);
                        opacity: 1;
                    }
                    46% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    58%, 100% {
                        transform: scale(1);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    )
}