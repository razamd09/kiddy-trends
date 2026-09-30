'use client'
import { useState } from 'react'

// Single-series column chart (Net Sale per bucket) — mark specs and
// interaction per the dataviz skill: rounded 4px bar tops square at the
// baseline, hairline gridlines, sequential-blue single hue (no legend
// needed for one series — the card title already names it), per-bar hover
// tooltip as the hit target, and every value is also readable in the table
// below so the tooltip only ever enhances, never gates.
const BAR_COLOR = '#2a78d6'
const GRID_COLOR = '#e1e0d9'
const AXIS_TEXT = '#898781'
const MAX_BARS = 12

function niceMax(value) {
    if (value <= 0) return 100
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
    const normalized = value / magnitude
    let niceNormalized
    if (normalized <= 1) niceNormalized = 1
    else if (normalized <= 2) niceNormalized = 2
    else if (normalized <= 5) niceNormalized = 5
    else niceNormalized = 10
    return niceNormalized * magnitude
}

function formatShort(n) {
    const v = Number(n) || 0
    if (Math.abs(v) >= 1000) return Math.round(v / 1000) + 'K'
    return String(Math.round(v))
}

export default function SalesBarChart({ rows, formatLabel }) {
    const [hoverIdx, setHoverIdx] = useState(null)

    // rows arrive newest-first (matching the table) — reverse to oldest→newest
    // so the chart reads left-to-right as a trend, and cap to the most
    // recent MAX_BARS so it never becomes an unreadable wall of thin bars.
    const chartRows = [...rows].slice(0, MAX_BARS).reverse()

    if (chartRows.length === 0) return null

    const width = 720
    const height = 220
    const padding = { top: 12, right: 12, bottom: 28, left: 44 }
    const plotW = width - padding.left - padding.right
    const plotH = height - padding.top - padding.bottom

    const maxVal = niceMax(Math.max(...chartRows.map((r) => r.netSale), 1))
    const gridSteps = 4
    const barSlot = plotW / chartRows.length
    const barWidth = Math.min(24, barSlot * 0.6)

    function yFor(v) {
        return padding.top + plotH - (Math.max(v, 0) / maxVal) * plotH
    }

    return (
        <div className="relative">
            <svg viewBox={'0 0 ' + width + ' ' + height} className="w-full h-auto" role="img" aria-label="Net Sale by period">
                {/* gridlines + axis labels */}
                {Array.from({ length: gridSteps + 1 }, (_, i) => {
                    const v = (maxVal / gridSteps) * i
                    const y = yFor(v)
                    return (
                        <g key={i}>
                            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={GRID_COLOR} strokeWidth="1" />
                            <text x={padding.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={AXIS_TEXT}>
                                {formatShort(v)}
                            </text>
                        </g>
                    )
                })}

                {chartRows.map((r, i) => {
                    const x = padding.left + i * barSlot + (barSlot - barWidth) / 2
                    const barTop = yFor(r.netSale)
                    const barH = Math.max(padding.top + plotH - barTop, 0)
                    const isHover = hoverIdx === i
                    return (
                        <g key={r.date}
                           onMouseEnter={() => setHoverIdx(i)}
                           onMouseLeave={() => setHoverIdx(null)}
                           onFocus={() => setHoverIdx(i)}
                           onBlur={() => setHoverIdx(null)}
                           tabIndex={0}
                           style={{ cursor: 'pointer', outline: 'none' }}>
                            {/* transparent hit area bigger than the bar itself */}
                            <rect x={padding.left + i * barSlot} y={padding.top} width={barSlot} height={plotH} fill="transparent" />
                            <rect
                                x={x}
                                y={barTop}
                                width={barWidth}
                                height={barH}
                                rx="4"
                                fill={BAR_COLOR}
                                opacity={isHover ? 1 : 0.85}
                            />
                            <text x={x + barWidth / 2} y={height - padding.bottom + 14} textAnchor="middle" fontSize="9" fill={AXIS_TEXT}>
                                {formatLabel(r.date)}
                            </text>
                        </g>
                    )
                })}
            </svg>

            {hoverIdx !== null && chartRows[hoverIdx] && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-charcoal text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
                    <p className="font-semibold">{'PKR ' + Math.round(chartRows[hoverIdx].netSale).toLocaleString()}</p>
                    <p className="text-white/60">{formatLabel(chartRows[hoverIdx].date, true)}</p>
                </div>
            )}
        </div>
    )
}
