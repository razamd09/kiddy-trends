'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_KEY = 'kt_spin_wheel_state'
const LOCK_MS = 12 * 60 * 60 * 1000
const MAX_SPINS_PER_WINDOW = 2

const SEGMENTS = [
  { label: 'Rs 20', amount: 20, weight: 18 },
  { label: 'Rs 30', amount: 30, weight: 16 },
  { label: 'Rs 40', amount: 40, weight: 14 },
  { label: 'Rs 50', amount: 50, weight: 13 },
  { label: 'Rs 60', amount: 60, weight: 12 },
  { label: 'Better Luck', amount: 0, weight: 12 },
  { label: 'Rs 70', amount: 70, weight: 6 },
  { label: 'Rs 80', amount: 80, weight: 5 },
  { label: 'Rs 90', amount: 90, weight: 4 },
]

function getDefaultState(now) {
  return {
    windowStartedAt: now,
    spinsUsed: 0,
    lockedUntil: 0,
    activeDiscount: 0,
    discountCode: '',
    consumed: false,
  }
}

function readState(now) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultState(now)
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return getDefaultState(now)

    const lockedUntil = Number(parsed.lockedUntil || 0)
    if (lockedUntil > now) {
      return {
        ...getDefaultState(now),
        ...parsed,
      }
    }

    const startedAt = Number(parsed.windowStartedAt || 0)
    if (!startedAt || now - startedAt >= LOCK_MS) {
      return getDefaultState(now)
    }

    return {
      ...getDefaultState(now),
      ...parsed,
      windowStartedAt: startedAt,
      lockedUntil: 0,
    }
  } catch {
    return getDefaultState(now)
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('kt-spin-wheel-updated'))
  }
}

function pickWeightedSegment() {
  const totalWeight = SEGMENTS.reduce((sum, s) => sum + s.weight, 0)
  let roll = Math.random() * totalWeight
  for (let i = 0; i < SEGMENTS.length; i += 1) {
    roll -= SEGMENTS[i].weight
    if (roll <= 0) return i
  }
  return 0
}

function getSegmentByRotation(totalRotation) {
  const segmentAngle = 360 / SEGMENTS.length
  const normalized = ((totalRotation % 360) + 360) % 360
  const pointerWheelAngle = (360 - normalized) % 360
  const index = Math.floor(pointerWheelAngle / segmentAngle) % SEGMENTS.length
  return SEGMENTS[index]
}

export default function SpinWheelPopup() {
  const [open, setOpen] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [spinsLeft, setSpinsLeft] = useState(0)
  const [showWinEffect, setShowWinEffect] = useState(false)
  const finalRotationRef = useRef(0)

  useEffect(() => {
    const now = Date.now()
    const state = readState(now)
    saveState(state)

    const canShow = now >= Number(state.lockedUntil || 0) && Number(state.spinsUsed || 0) < MAX_SPINS_PER_WINDOW
    setSpinsLeft(Math.max(0, MAX_SPINS_PER_WINDOW - Number(state.spinsUsed || 0)))
    setOpen(canShow)
  }, [])

  const wheelStyle = useMemo(() => {
    const gradientStops = SEGMENTS.map((segment, index) => {
      const start = (index / SEGMENTS.length) * 100
      const end = ((index + 1) / SEGMENTS.length) * 100
      const color = segment.amount > 0 ? (index % 2 ? '#FDE68A' : '#FCA5A5') : '#E5E7EB'
      return `${color} ${start}% ${end}%`
    }).join(', ')

    return {
      background: `conic-gradient(${gradientStops})`,
      transform: `rotate(${rotation}deg)`,
      transition: spinning ? 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
    }
  }, [rotation, spinning])

  const segmentLabels = useMemo(() => {
    const segmentAngle = 360 / SEGMENTS.length
    return SEGMENTS.map((segment, index) => {
      const angle = index * segmentAngle + (segmentAngle / 2) - 90
      return {
        ...segment,
        angle,
      }
    })
  }, [])

  function spinNow() {
    if (spinning) return
    setSpinning(true)
    setResult(null)
    setShowWinEffect(false)

    const selectedIndex = pickWeightedSegment()
    const segmentAngle = 360 / SEGMENTS.length
    const centerAngle = selectedIndex * segmentAngle + (segmentAngle / 2)
    // Pointer is at top (0deg). Rotate wheel so selected segment center lands exactly under pointer.
    const targetAngle = (360 - centerAngle) % 360
    const fullSpins = 5 + Math.floor(Math.random() * 2)
    setRotation((prev) => {
      const currentAngle = ((prev % 360) + 360) % 360
      const deltaToTarget = (targetAngle - currentAngle + 360) % 360
      const nextRotation = prev + (fullSpins * 360) + deltaToTarget
      finalRotationRef.current = nextRotation
      return nextRotation
    })

    window.setTimeout(() => {
      const now = Date.now()
      const state = readState(now)
      const landed = getSegmentByRotation(finalRotationRef.current)
      const nextSpinsUsed = Math.min(MAX_SPINS_PER_WINDOW, Number(state.spinsUsed || 0) + 1)
      const nextState = {
        ...state,
        spinsUsed: nextSpinsUsed,
      }

      if (landed.amount > 0) {
        nextState.pendingDiscount = landed.amount
        nextState.pendingCode = 'SPIN' + landed.amount
        nextState.activeDiscount = 0
        nextState.discountCode = ''
        nextState.consumed = false
        nextState.lockedUntil = now + LOCK_MS
      } else if (nextSpinsUsed >= MAX_SPINS_PER_WINDOW) {
        nextState.lockedUntil = now + LOCK_MS
      }

      saveState(nextState)
      setSpinsLeft(Math.max(0, MAX_SPINS_PER_WINDOW - nextSpinsUsed))
      setResult(landed)
      setSpinning(false)
      if (landed.amount > 0) {
        setShowWinEffect(true)
      }
    }, 4100)
  }

  function applyDiscount() {
    if (!result || result.amount <= 0) return
    const now = Date.now()
    const state = readState(now)
    saveState({
      ...state,
      activeDiscount: result.amount,
      discountCode: state.pendingCode || ('SPIN' + result.amount),
      pendingDiscount: 0,
      pendingCode: '',
      consumed: false,
    })
    setShowWinEffect(false)
    setOpen(false)
  }

  function closePopup() {
    const now = Date.now()
    const state = readState(now)
    const cleared = {
      ...state,
      pendingDiscount: 0,
      pendingCode: '',
    }
    if (result?.amount > 0) {
      cleared.activeDiscount = 0
      cleared.discountCode = ''
      cleared.consumed = true
    }
    saveState(cleared)
    setShowWinEffect(false)
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center">
        {showWinEffect && result?.amount > 0 && (
          <div className="absolute inset-0 z-20 rounded-3xl pointer-events-none bg-gradient-to-b from-yellow-100/80 via-white/30 to-pink-100/80 animate-pulse">
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center px-4">
                <p className="text-4xl mb-2 animate-bounce">🎉</p>
                <p className="font-display text-2xl text-coral">WOOOWW!</p>
                <p className="font-display text-xl text-charcoal">You won PKR {result.amount} discount</p>
              </div>
            </div>
          </div>
        )}
        <p className="font-display text-2xl text-charcoal mb-1">Spin & Win Discount 🎯</p>
        <p className="text-sm text-gray-500 mb-4">Win PKR discount for checkout (max PKR 100)</p>

        <div className="relative w-64 h-64 mx-auto mb-4">
          <div className="absolute left-1/2 -translate-x-1/2 -top-2 text-coral text-2xl z-10">▼</div>
          <div className="w-64 h-64 rounded-full border-8 border-coral/20 shadow-inner mx-auto overflow-hidden relative" style={wheelStyle}>
            {segmentLabels.map((segment, idx) => (
              <div
                key={segment.label + idx}
                className="absolute left-1/2 top-1/2 text-[11px] font-bold text-charcoal"
                style={{
                  transform: `rotate(${segment.angle}deg) translate(0, -102px) rotate(${-segment.angle}deg)`,
                  transformOrigin: 'center',
                }}
              >
                {segment.amount > 0 ? ('Rs ' + segment.amount) : 'No Luck'}
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-charcoal text-white flex items-center justify-center font-display text-sm">SPIN</div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-4">Attempts left in this window: {spinsLeft}</p>

        {result && (
          <p className={'font-semibold mb-4 ' + (result.amount > 0 ? 'text-green-600' : 'text-gray-500')}>
            {result.amount > 0
              ? ('🎉 You won PKR ' + result.amount + ' discount!')
              : '🙂 Better luck next time!'}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={result?.amount > 0 ? applyDiscount : spinNow}
            disabled={spinning || spinsLeft <= 0 || (result && result.amount <= 0 && spinsLeft <= 0)}
            className="w-full bg-coral text-white font-display text-base py-3 rounded-2xl hover:bg-opacity-90 disabled:opacity-60 relative z-30"
          >
            {result?.amount > 0 ? 'Apply Discount' : (spinning ? 'Spinning...' : 'Spin Now')}
          </button>
          <button
            onClick={closePopup}
            className="w-full bg-gray-100 text-charcoal font-display text-base py-3 rounded-2xl hover:bg-gray-200 relative z-30"
          >
            Cancel / Close
          </button>
        </div>
      </div>
    </div>
  )
}
