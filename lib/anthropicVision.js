import { CHARACTERS, CHARACTER_SLUGS } from './characters'

// Requires ANTHROPIC_API_KEY in your server-side environment (Vercel project
// settings → Environment Variables). Never expose this key to the client —
// it must only ever be read inside API routes / server code.
// Pick a currently-available Claude model with vision support from your
// Anthropic console/docs — model IDs change over time, so this is read from
// an env var with a fallback rather than hardcoded, and defaults to a
// smaller/cheaper model since this is a bulk classification task, not one
// that needs deep reasoning.
const MODEL = process.env.ANTHROPIC_VISION_MODEL || 'claude-haiku-4-5'

const CHARACTER_LIST_TEXT = CHARACTERS
  .map(c => `- ${c.slug}: ${c.hint}`)
  .join('\n')

const SYSTEM_PROMPT = `You are labeling children's clothing product photos for an e-commerce catalog's internal tagging system. You will be shown one product image. Decide whether it clearly, specifically depicts any of these licensed characters/franchises:

${CHARACTER_LIST_TEXT}

Rules:
- Only choose a slug if there's a clear, specific depiction (a recognizable face, costume, or official logo/artwork) — not just a generic superhero cape, a generic cartoon animal, or an unrelated print.
- A product can match zero, one, or multiple slugs (e.g. a Marvel team print might match both "spider-man" and "marvel").
- If nothing matches, return an empty array for "characters".
- "confidence" (0 to 1) should reflect how sure you are about the *entire* answer — including how sure you are that "no match" is correct, when you return an empty array.
- Respond with ONLY minified JSON, no markdown, no other text, in exactly this shape:
{"characters":["slug1","slug2"],"confidence":0.0,"reasoning":"one short phrase"}`

async function fetchImageAsBase64(imageUrl) {
  const res = await fetch(imageUrl)
  if (!res.ok) {
    throw new Error(`Failed to fetch product image (${res.status}): ${imageUrl}`)
  }
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const buffer = Buffer.from(await res.arrayBuffer())
  return { base64: buffer.toString('base64'), mediaType: contentType.split(';')[0] }
}

function parseModelResponse(text) {
  // Models occasionally wrap JSON in a code fence despite instructions —
  // strip that defensively before parsing.
  const cleaned = text.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim()
  const parsed = JSON.parse(cleaned)

  if (!Array.isArray(parsed.characters)) {
    throw new Error('Model response missing a "characters" array')
  }
  const characters = parsed.characters.filter(slug => CHARACTER_SLUGS.includes(slug))

  const confidence = typeof parsed.confidence === 'number'
    ? Math.max(0, Math.min(1, parsed.confidence))
    : 0

  return {
    characters,
    confidence,
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
  }
}

// Classifies one product image. Returns { characters, confidence, reasoning }.
// Throws on network/parsing failure — callers should catch this per-item so
// one bad image doesn't take down the whole batch.
export async function classifyProductImage(imageUrl) {
  const { base64, mediaType } = await fetchImageAsBase64(imageUrl)

  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured')
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: 'Classify this product image according to your instructions. Respond with only the JSON object.' },
        ],
      }],
    }),
  })

  if (!response.ok) throw new Error(`Anthropic API error (${response.status}): ${await response.text()}`)
  const responseData = await response.json()

  const textBlock = responseData.content?.find(block => block.type === 'text')
  if (!textBlock) {
    throw new Error('No text content in model response')
  }

  return parseModelResponse(textBlock.text)
}
