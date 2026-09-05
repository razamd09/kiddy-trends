'use client'
import { useState, useRef, useCallback } from 'react'
import { CHARACTERS, CLIENT_CONCURRENCY } from '../../../lib/characters'

// Admin screen for the AI character-tagging job:
//   1. "Scan products" kicks off a job and drives it to completion by
//      calling /process-batch in a loop (this is what makes the "background"
//      job actually progress — see the note in lib/characters.js about why
//      that's the right shape on serverless hosting).
//   2. Once done, anything the AI wasn't confident about shows up below as a
//      review queue — each card is pre-filled with the AI's best guess, and
//      a human just confirms or corrects it with one click.
export default function CharacterTaggingPage() {
  const [job, setJob] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [startError, setStartError] = useState(null)
  const stopFlag = useRef(false)

  const [reviewItems, setReviewItems] = useState([])
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState(null)

  const loadReviewItems = useCallback(async () => {
    setReviewLoading(true)
    setReviewError(null)
    try {
      const res = await fetch('/api/character-tagging/review-items?limit=100', { headers: { 'x-admin-token': localStorage.getItem('admin_token') || '' } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load review items')
      setReviewItems(data.items || [])
    } catch (err) {
      setReviewError(String(err.message || err))
    } finally {
      setReviewLoading(false)
    }
  }, [])

  const runProcessLoop = useCallback(async (jobId) => {
    stopFlag.current = false

    async function worker() {
      while (!stopFlag.current) {
        const res = await fetch('/api/character-tagging/process-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': localStorage.getItem('admin_token') || '' },
          body: JSON.stringify({ jobId }),
        })
        const data = await res.json()
        if (!res.ok) {
          stopFlag.current = true
          setStartError(data.error || data.errors?.join(' | ') || 'A batch failed')
          return
        }
        if (data.errors?.length) setStartError(data.errors.join(' | '))
        if (data.job) setJob(data.job)
        if (data.done) {
          stopFlag.current = true
          return
        }
      }
    }

    // Run a few workers in parallel so throughput isn't limited to one
    // image at a time, while staying within a sane concurrency bound.
    await Promise.all(Array.from({ length: CLIENT_CONCURRENCY }, worker))
    setIsRunning(false)
    loadReviewItems()
  }, [loadReviewItems])

  async function startScan(force) {
    setStartError(null)
    setIsRunning(true)
    try {
      const res = await fetch('/api/character-tagging/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': localStorage.getItem('admin_token') || '' },
        body: JSON.stringify({ force }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start job')
      setJob({
        id: data.jobId,
        status: 'running',
        total_products: data.totalProducts,
        processed_count: 0,
        auto_tagged_count: 0,
        needs_review_count: 0,
        failed_count: 0,
      })
      runProcessLoop(data.jobId)
    } catch (err) {
      setStartError(String(err.message || err))
      setIsRunning(false)
    }
  }

  function cancelScan() {
    stopFlag.current = true
    setIsRunning(false)
  }

  const progressPct = job && job.total_products > 0
    ? Math.round((job.processed_count / job.total_products) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl mb-2" style={{ color: '#1f3a52' }}>
        AI character tagging
      </h1>
      <p className="text-base mb-8" style={{ color: '#4f6c85' }}>
        Scans product photos and tags each one with the character(s) it recognizes.
        Confident matches are applied automatically; anything uncertain shows up
        below for a quick one-click confirmation.
      </p>

      <div className="rounded-2xl border p-6 mb-10" style={{ borderColor: 'rgba(31,58,82,0.12)' }}>
        <div className="flex flex-wrap gap-3 mb-5">
          <button
            type="button"
            onClick={() => startScan(false)}
            disabled={isRunning}
            className="rounded-full font-display text-sm px-6 py-3 disabled:opacity-50"
            style={{ background: '#1f3a52', color: '#ffffff' }}
          >
            {isRunning ? 'Scanning…' : 'Scan untagged products'}
          </button>
          <button
            type="button"
            onClick={() => startScan(true)}
            disabled={isRunning}
            className="rounded-full font-display text-sm px-6 py-3 border-2 bg-transparent disabled:opacity-50"
            style={{ color: '#1f3a52', borderColor: '#1f3a52' }}
          >
            Re-scan all products
          </button>
          {isRunning && (
            <button
              type="button"
              onClick={cancelScan}
              className="rounded-full font-display text-sm px-6 py-3 border-2 bg-transparent"
              style={{ color: '#e8635a', borderColor: '#e8635a' }}
            >
              Stop
            </button>
          )}
        </div>

        {startError && (
          <p className="text-sm mb-4" style={{ color: '#e8635a' }}>{startError}</p>
        )}

        {job && (
          <div>
            <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%`, background: '#e8635a' }}
              />
            </div>
            <p className="text-sm mb-1" style={{ color: '#1f3a52' }}>
              {job.processed_count} / {job.total_products} processed ({progressPct}%)
              {job.status === 'completed' && ' — done'}
            </p>
            <p className="text-sm" style={{ color: '#4f6c85' }}>
              {job.auto_tagged_count} auto-tagged · {job.needs_review_count} need review · {job.failed_count} failed
            </p>
          </div>
        )}
      </div>

      <h2 className="font-display text-2xl mb-4" style={{ color: '#1f3a52' }}>
        Review queue{reviewItems.length > 0 ? ` (${reviewItems.length})` : ''}
      </h2>

      {reviewLoading && <p style={{ color: '#4f6c85' }}>Loading…</p>}
      {reviewError && <p style={{ color: '#e8635a' }}>{reviewError}</p>}
      {!reviewLoading && reviewItems.length === 0 && (
        <p style={{ color: '#4f6c85' }}>Nothing waiting on review right now.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviewItems.map(item => (
          <ReviewCard
            key={item.id}
            item={item}
            onConfirmed={() => setReviewItems(prev => prev.filter(p => p.id !== item.id))}
          />
        ))}
      </div>
    </div>
  )
}

function ReviewCard({ item, onConfirmed }) {
  const suggested = item.character_suggestions?.characters || []
  const [selected, setSelected] = useState(new Set(item.characters?.length ? item.characters : suggested))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function toggle(slug) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/character-tagging/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': localStorage.getItem('admin_token') || '' },
        body: JSON.stringify({ productId: item.id, characters: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      onConfirmed()
    } catch (err) {
      setError(String(err.message || err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(31,58,82,0.12)' }}>
      <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-gray-50">
        {item.image_url && (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        )}
      </div>
      <p className="font-display text-sm mb-2 truncate" style={{ color: '#1f3a52' }}>{item.name}</p>
      {item.character_suggestions?.reasoning && (
        <p className="text-xs mb-3 italic" style={{ color: '#4f6c85' }}>
          AI: “{item.character_suggestions.reasoning}”
          {typeof item.character_suggestions.confidence === 'number' &&
            ` (${Math.round(item.character_suggestions.confidence * 100)}% confident)`}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mb-3">
        {CHARACTERS.map(c => (
          <button
            key={c.slug}
            type="button"
            onClick={() => toggle(c.slug)}
            className="text-xs px-2.5 py-1 rounded-full border"
            style={selected.has(c.slug)
              ? { background: '#1f3a52', color: '#ffffff', borderColor: '#1f3a52' }
              : { background: '#ffffff', color: '#1f3a52', borderColor: 'rgba(31,58,82,0.2)' }}
          >
            {c.name}
          </button>
        ))}
      </div>
      {error && <p className="text-xs mb-2" style={{ color: '#e8635a' }}>{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full rounded-full font-display text-xs px-4 py-2 disabled:opacity-50"
        style={{ background: '#e8635a', color: '#ffffff' }}
      >
        {saving ? 'Saving…' : 'Confirm'}
      </button>
    </div>
  )
}
