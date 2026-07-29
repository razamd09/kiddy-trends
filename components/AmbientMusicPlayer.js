'use client'

import { useEffect, useRef, useState } from 'react'

const MELODY = [261.63, 293.66, 329.63, 392, 349.23, 293.66]
const HARMONY = [392, 493.88, 523.25, 493.88]
const STEP_MS = 700

export default function AmbientMusicPlayer() {
  const [isEnabled, setIsEnabled] = useState(false)
  const audioContextRef = useRef(null)
  const masterGainRef = useRef(null)
  const intervalRef = useRef(null)
  const noteIndexRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = window.localStorage.getItem('kiddy-trends-music')
    if (saved === 'enabled') {
      setIsEnabled(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('kiddy-trends-music', isEnabled ? 'enabled' : 'disabled')
  }, [isEnabled])

  useEffect(() => {
    if (!isEnabled) {
      stopMusic()
      return
    }

    startMusic()
    return () => stopMusic()
  }, [isEnabled])

  const playTone = (ctx, destination, frequency, startTime, duration, type, volume) => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, startTime)

    gainNode.gain.setValueAtTime(0.0001, startTime)
    gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.08)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(destination)

    oscillator.start(startTime)
    oscillator.stop(startTime + duration + 0.05)
  }

  const startMusic = async () => {
    if (audioContextRef.current) return

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.0001, ctx.currentTime)
    masterGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.6)
    masterGain.connect(ctx.destination)

    audioContextRef.current = ctx
    masterGainRef.current = masterGain

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    noteIndexRef.current = 0
    intervalRef.current = window.setInterval(() => {
      const now = ctx.currentTime
      const melodyNote = MELODY[noteIndexRef.current % MELODY.length]
      const harmonyNote = HARMONY[Math.floor(noteIndexRef.current / 2) % HARMONY.length]

      playTone(ctx, masterGain, melodyNote, now, 0.48, 'sine', 0.024)
      if (noteIndexRef.current % 2 === 0) {
        playTone(ctx, masterGain, harmonyNote, now + 0.02, 0.3, 'triangle', 0.012)
      }

      noteIndexRef.current += 1
    }, STEP_MS)
  }

  const stopMusic = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (audioContextRef.current && masterGainRef.current) {
      const ctx = audioContextRef.current
      const gain = masterGainRef.current
      gain.gain.cancelScheduledValues(ctx.currentTime)
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4)

      window.setTimeout(() => {
        if (ctx.state !== 'closed') {
          ctx.suspend().catch(() => {})
        }
      }, 450)
    }

    audioContextRef.current = null
    masterGainRef.current = null
  }

  const toggleMusic = () => {
    setIsEnabled((prev) => !prev)
  }

  return (
    <button
      type="button"
      onClick={toggleMusic}
      aria-label={isEnabled ? 'Turn off ambient music' : 'Turn on ambient music'}
      className={`fixed bottom-24 left-4 z-50 flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold shadow-lg backdrop-blur transition-all ${isEnabled
        ? 'border-charcoal bg-charcoal text-white'
        : 'border-gray-200 bg-white/90 text-charcoal hover:bg-white'}`}
    >
      <span className={`text-base ${isEnabled ? 'animate-pulse' : ''}`}>♫</span>
      <span>{isEnabled ? 'Music on' : 'Music off'}</span>
    </button>
  )
}
