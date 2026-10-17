'use client'
import { useState } from 'react'

// Stacked column chart — one bar per period, segments = order status counts.
// Stack order (bottom→top) is chosen for CVD-safe adjacency (validated via
// the dataviz skill's palette checker), not pipeline order — Dispatched's
// purple and Processing's blue fail adjacent-pair contrast under deuteranopia
// at ΔE 1.3, so Cancelled's red is placed between them instead. The legend
// below lists the same order so stack and legend always agree.
const STATUS_STACK = [
    { key: 'pending', label: 'Pending', color: '#ea580c' },
    { key: 'processing', label: 'Processing', color: '#2563eb' },
    { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
    { key: 'dispatched', label: 'Dispatched', color: '#9333ea' },
    { key: 'delivered', label: 'Delivered', color: '#16a34a' },
]

const GRID_COLOR = '#e1e0d9'
const AXIS_TEXT = '#898781'
const SEGMENT_GAP = 2
const MAX_BARS = 12

function niceMax(value) {
    if (value <= 0) return 10
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
    const normalized = value / magnitude
    let niceNormalized
    if (normalized <= 1) niceNormalized = 1
    else if (normalized <= 2) niceNormalized = 2
    else if (normalized <= 5) niceNormalized = 5
    else niceNormalized = 10
    return niceNormalized * magnitude
}

export default function OrdersStatusBarChart({ rows, formatLabel }) {
    const [hover, setHover] = useState(null) // { barIdx, statusKey }

    const chartRows = [...rows].slice(0, MAX_BARS).reverse()
    if (chartRows.length === 0) return null

    const width = 720
    const height = 240
    const padding = { top: 12, right: 12, bottom: 28, left: 36 }
    const plotW = width - padding.left - padding.right
    const plotH = height - padding.top - padding.bottom

    const maxVal = niceMax(Math.max(...chartRows.map((r) => r.total), 1))
    const gridSteps = 4
    const barSlot = plotW / chartRows.length
    const barWidth = Math.min(28, barSlot * 0.6)

    function yFor(v) {
        return padding.top + plotH - (Math.max(v, 0) / maxVal) * plotH
    }

    return (
        <div className="relative">
            {/* Legend — always present for >=2 series */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                {STATUS_STACK.map((s) => (
                    <div key={s.key} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                        {s.label}
                    </div>
                ))}
            </div>

            <svg viewBox={'0 0 ' + width + ' ' + height} className="w-full h-auto" role="img" aria-label="Orders by status per period">
                {Array.from({ length: gridSteps + 1 }, (_, i) => {
                    const v = (maxVal / gridSteps) * i
                    const y = yFor(v)
                    return (
                        <g key={i}>
                            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={GRID_COLOR} strokeWidth="1" />
                            <text x={padding.left - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={AXIS_TEXT}>
                                {Math.round(v)}
                            </text>
                        </g>
                    )
                })}

                {chartRows.map((r, i) => {
                    const x = padding.left + i * barSlot + (barSlot - barWidth) / 2
                    let cursor = padding.top + plotH // baseline, building upward
                    const segments = STATUS_STACK.map((s) => {
                        const value = Number(r[s.key]) || 0
                        const rawH = (value / maxVal) * plotH
                        const segH = Math.max(rawH - (value > 0 ? SEGMENT_GAP : 0), 0)
                        const segTop = cursor - rawH
                        cursor -= rawH
                        return { ...s, value, top: segTop, height: segH }
                    })

                    return (
                        <g key={r.date}>
                            {/* transparent hit area spanning the whole bar column */}
                            <rect x={padding.left + i * barSlot} y={padding.top} width={barSlot} height={plotH} fill="transparent" />
                            {segments.filter((s) => s.value > 0).map((s) => (
                                <rect
                                    key={s.key}
                                    x={x}
                                    y={s.top}
                                    width={barWidth}
                                    height={s.height}
                                    rx="2"
                                    fill={s.color}
                                    opacity={hover && hover.barIdx === i && hover.statusKey !== s.key ? 0.45 : 1}
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={() => setHover({ barIdx: i, statusKey: s.key })}
                                    onMouseLeave={() => setHover(null)}
                                />
                            ))}
                            <text x={x + barWidth / 2} y={height - padding.bottom + 14} textAnchor="middle" fontSize="9" fill={AXIS_TEXT}>
                                {formatLabel(r.date)}
                            </text>
                        </g>
                    )
                })}
            </svg>

            {hover && (() => {
                const row = chartRows[hover.barIdx]
                const status = STATUS_STACK.find((s) => s.key === hover.statusKey)
                if (!row || !status) return null
                return (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-charcoal text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
                        <p className="font-semibold">{status.label}: {row[status.key]}</p>
                        <p className="text-white/60">{formatLabel(row.date, true)}</p>
                    </div>
                )
            })()}
        </div>
    )
}
