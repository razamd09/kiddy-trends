'use client'

// Animates the REAL Kiddy Trends logo (public/logo.jpg) as 9 puzzle tiles that
// fly apart and reassemble on a loop. Each tile shows a real slice of your
// actual logo image (via CSS background-position), not a redrawn copy.
//
// Usage: <AnimatedLogo /> — self-contained square, drop it wherever the
// static logo image used to sit.

// Scatter direction for each of the 9 tiles (dx px, dy px, rotate deg).
const directions = [
    [-70, -60, -18],
    [0, -80, 10],
    [70, -60, -14],
    [-90, 0, 16],
    [0, 0, 0],
    [90, 0, -16],
    [-70, 60, 14],
    [0, 80, -10],
    [70, 60, 18],
]

export default function AnimatedLogo({ src = '/logo.jpg' }) {
    return (
        <div
            style={{
                width: '100%',
                aspectRatio: '1 / 1',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'repeat(3, 1fr)',
                gap: '4px',
            }}
        >
            {directions.map(([dx, dy, rot], i) => {
                const col = i % 3
                const row = Math.floor(i / 3)
                return (
                    <div
                        key={i}
                        className="kt-logo-tile"
                        style={{
                            backgroundImage: `url(${src})`,
                            backgroundSize: '300% 300%',
                            backgroundPosition: `${col * 50}% ${row * 50}%`,
                            borderRadius: '10px',
                            '--dx': dx + 'px',
                            '--dy': dy + 'px',
                            '--rot': rot + 'deg',
                            animationDelay: (i * 0.04) + 's',
                        }}
                    />
                )
            })}

            <style jsx>{`
                .kt-logo-tile {
                    animation: kt-logo-cycle 6s ease-in-out infinite;
                }
                @keyframes kt-logo-cycle {
                    0% {
                        transform: translate(0, 0) rotate(0deg);
                    }
                    35% {
                        transform: translate(0, 0) rotate(0deg);
                    }
                    65% {
                        transform: translate(var(--dx), var(--dy)) rotate(var(--rot));
                    }
                    90% {
                        transform: translate(var(--dx), var(--dy)) rotate(var(--rot));
                    }
                    100% {
                        transform: translate(0, 0) rotate(0deg);
                    }
                }
            `}</style>
        </div>
    )
}