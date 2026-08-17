'use client'

// Animated version of the Kiddy Trends block-grid logo: the 9 tiles fly apart
// and reassemble on a continuous loop. Pure CSS animation, no JS/dependencies.
//
// Usage: drop <AnimatedLogo /> in place of the static logo <Image> in your
// hero. It's self-contained (fixed aspect-ratio square) so it can sit inside
// the same wrapper div you already have.

const blocks = [
    { bg: '#e8635a', content: 'eye', delay: 0 },
    { bg: '#f2ede0', content: 'kiddy', delay: 0.05 },
    { bg: '#f2ede0', content: 'trends', delay: 0.1 },
    { bg: '#3a4a63', content: 'squiggle', delay: 0.15 },
    { bg: '#7fc8e0', content: 'teeth', delay: 0.2 },
    { bg: '#f2d24a', content: null, delay: 0.25 },
    { bg: '#f2d24a', content: null, delay: 0.3 },
    { bg: '#3a4a63', content: null, delay: 0.35 },
    { bg: '#7fc8e0', content: 'eye-lash', delay: 0.4 },
]

// Each block gets its own scatter direction so they fly apart differently.
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

function BlockContent({ type }) {
    switch (type) {
        case 'eye':
            return (
                <div style={{ width: '38%', height: '38%', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '45%', height: '45%', borderRadius: '50%', background: '#111' }} />
                </div>
            )
        case 'eye-lash':
            return (
                <div style={{ position: 'relative', width: '38%', height: '38%' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '45%', height: '45%', borderRadius: '50%', background: '#111' }} />
                    </div>
                    <div style={{ position: 'absolute', top: '-22%', left: '10%', width: '2px', height: '30%', background: '#111', transform: 'rotate(-20deg)' }} />
                    <div style={{ position: 'absolute', top: '-26%', left: '45%', width: '2px', height: '32%', background: '#111' }} />
                    <div style={{ position: 'absolute', top: '-22%', right: '10%', width: '2px', height: '30%', background: '#111', transform: 'rotate(20deg)' }} />
                </div>
            )
        case 'teeth':
            return <div style={{ width: '55%', height: '22%', background: '#fff', borderRadius: '4px' }} />
        case 'squiggle':
            return <div style={{ width: '65%', height: '18%', background: '#7fc8e0', borderRadius: '20px' }} />
        case 'kiddy':
            return <span style={{ fontFamily: "'Fredoka One', cursive", color: '#e8635a', fontSize: '15%' }}>KIDDY</span>
        case 'trends':
            return <span style={{ fontFamily: "'Fredoka One', cursive", color: '#e8635a', fontSize: '15%' }}>TRENDS</span>
        default:
            return null
    }
}

export default function AnimatedLogo() {
    return (
        <div
            style={{
                width: '100%',
                aspectRatio: '1 / 1',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'repeat(3, 1fr)',
                gap: '6px',
                padding: '6px',
            }}
        >
            {blocks.map((block, i) => {
                const [dx, dy, rot] = directions[i]
                return (
                    <div
                        key={i}
                        className="kt-logo-block"
                        style={{
                            background: block.bg,
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '--dx': dx + 'px',
                            '--dy': dy + 'px',
                            '--rot': rot + 'deg',
                            animationDelay: block.delay + 's',
                        }}
                    >
                        <BlockContent type={block.content} />
                    </div>
                )
            })}

            <style jsx>{`
                .kt-logo-block {
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
