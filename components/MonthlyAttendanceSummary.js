'use client'

// Standard working day. A completed day shorter than this is flagged "Too Early".
export const STANDARD_WORK_MINUTES = 9 * 60

function pad(n) { return String(n).padStart(2, '0') }

export function formatDuration(minutes) {
    if (!minutes) return '—'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h + 'h ' + m + 'm'
}

// Build a per-day breakdown and totals for the month containing `monthDate`.
// Rules: Sunday is always "off" (never absent). A working day (Mon-Sat) with no
// check-in is "absent". A completed day under 9h is "too_early". The absent count
// only considers days that have already elapsed for the current month.
export function computeMonthlySummary(records, monthDate = new Date()) {
    const year  = monthDate.getFullYear()
    const month = monthDate.getMonth() // 0-based
    const today = new Date()
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
    const lastDay = new Date(year, month + 1, 0).getDate()
    const endDay  = isCurrentMonth ? today.getDate() : lastDay

    const byDate = {}
    ;(records || []).forEach(r => { if (r?.date) byDate[r.date] = r })

    const days = []
    let present = 0, absent = 0, sundays = 0, tooEarly = 0, incomplete = 0
    let completed = 0, totalMinutes = 0

    for (let d = 1; d <= endDay; d++) {
        const dateObj = new Date(year, month, d)
        const key = year + '-' + pad(month + 1) + '-' + pad(d)
        const isSunday = dateObj.getDay() === 0
        const rec = byDate[key] || null
        let status

        if (isSunday) {
            sundays++
            status = 'off'
        } else if (rec && rec.time_in) {
            present++
            if (rec.time_out) {
                const mins = rec.duration_minutes || 0
                totalMinutes += mins
                completed++
                if (mins < STANDARD_WORK_MINUTES) { tooEarly++; status = 'too_early' }
                else status = 'complete'
            } else {
                incomplete++
                status = 'incomplete'
            }
        } else {
            absent++
            status = 'absent'
        }

        days.push({ date: key, dateObj, isSunday, rec, status, minutes: rec?.duration_minutes || 0 })
    }

    const avgMinutes = completed > 0 ? Math.round(totalMinutes / completed) : 0
    return { year, month, present, absent, sundays, tooEarly, incomplete, completed, totalMinutes, avgMinutes, days }
}

const STATUS_BADGE = {
    complete:   { label: 'Present',    cls: 'bg-green-100 text-green-600' },
    too_early:  { label: 'Too Early',  cls: 'bg-orange-100 text-orange-500' },
    incomplete: { label: 'Not clocked out', cls: 'bg-yellow-100 text-yellow-600' },
    absent:     { label: 'Absent',     cls: 'bg-red-100 text-red-500' },
    off:        { label: 'Off',        cls: 'bg-gray-100 text-gray-400' },
}

// Reusable monthly attendance summary — used on both the employee dashboard and
// the admin attendance screen.
export default function MonthlyAttendanceSummary({ records, monthDate = new Date(), showDays = true }) {
    const s = computeMonthlySummary(records, monthDate)
    const monthLabel = new Date(s.year, s.month, 1).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })

    const cards = [
        { label: 'Present',      value: s.present,                    icon: '✅', color: 'bg-green-50' },
        { label: 'Absent',       value: s.absent,                     icon: '❌', color: 'bg-red-50' },
        { label: 'Too Early',    value: s.tooEarly,                   icon: '⏰', color: 'bg-orange-50' },
        { label: 'Avg Hrs/Day',  value: formatDuration(s.avgMinutes), icon: '⏱️', color: 'bg-sunny/20' },
    ]

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="font-display text-lg text-charcoal">Monthly Attendance Summary</p>
                <span className="text-sm text-gray-400">{monthLabel}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {cards.map((c, i) => (
                    <div key={i} className={'rounded-2xl p-4 text-center ' + c.color}>
                        <p className="text-xl mb-1">{c.icon}</p>
                        <p className="font-display text-2xl text-charcoal">{c.value}</p>
                        <p className="text-xs text-gray-500">{c.label}</p>
                    </div>
                ))}
            </div>

            <p className="text-xs text-gray-400 mb-4">
                Standard working day is <strong>9 hours</strong>. Sundays are off. Days worked under 9h are marked <span className="text-orange-500 font-semibold">Too Early</span>.
            </p>

            {showDays && (
                s.days.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-4">No days to show yet</p>
                ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                        {[...s.days].reverse().map((day, i) => {
                            const badge = STATUS_BADGE[day.status] || STATUS_BADGE.absent
                            return (
                                <div key={i} className="flex items-center justify-between bg-cream rounded-xl px-4 py-2.5">
                                    <div>
                                        <p className="font-semibold text-sm text-charcoal">
                                            {day.dateObj.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </p>
                                        {day.rec?.time_in && (
                                            <p className="text-xs text-gray-400">
                                                {new Date(day.rec.time_in).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                {' → '}
                                                {day.rec.time_out
                                                    ? new Date(day.rec.time_out).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
                                                    : 'Not clocked out'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        {day.minutes > 0 && <p className="font-bold text-coral text-sm">{formatDuration(day.minutes)}</p>}
                                        <span className={'text-xs px-2 py-0.5 rounded-full font-semibold ' + badge.cls}>
                                            {badge.label}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
            )}
        </div>
    )
}
