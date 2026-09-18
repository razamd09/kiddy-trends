import { createWorker } from 'tesseract.js'

export const runtime = 'nodejs'
export const maxDuration = 60

const FABRIC_KEYWORD_MAP = [
    { re: /\bterry\b/i, value: 'Terry' },
    { re: /\bjersy\b|\bjersey\b/i, value: 'Jersy' },
    { re: /\bfleece\b/i, value: 'Fleece' },
    { re: /\bsilk\s*cotton\b/i, value: 'Silk Cotton' },
    { re: /\bsilk\b/i, value: 'Silk' },
    { re: /\bdenim\b|\bjeans?\b/i, value: 'Denim' },
    { re: /\bcotton\b/i, value: 'Cotton' },
]

function parseAgeRange(text) {
    const match = text.match(/(\d{1,2})\s*(?:-|–|—|to)\s*(\d{1,2})\s*years?/i)
    if (!match) return { ageStart: null, ageEnd: null }
    const a = parseInt(match[1], 10)
    const b = parseInt(match[2], 10)
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return { ageStart: null, ageEnd: null }
    return { ageStart: a, ageEnd: b }
}

function parsePrice(text) {
    let match = text.match(/(\d{2,6})\s*\/\s*[-=]/)
    if (match) return parseInt(match[1], 10)
    match = text.match(/(?:rs\.?|pkr)\s*(\d{2,6})/i)
    if (match) return parseInt(match[1], 10)
    match = text.match(/(\d{2,6})\s*\/?-?\s*only/i)
    if (match) return parseInt(match[1], 10)
    return null
}

function parseFabric(text) {
    for (const { re, value } of FABRIC_KEYWORD_MAP) {
        if (re.test(text)) return value
    }
    return ''
}

function parseCaption(rawText) {
    const text = String(rawText || '')
    const { ageStart, ageEnd } = parseAgeRange(text)
    return {
        ageStart,
        ageEnd,
        price: parsePrice(text),
        fabric: parseFabric(text),
    }
}

export async function POST(request) {
    let worker = null
    try {
        const formData = await request.formData()
        const file = formData.get('file')
        if (!file || typeof file.arrayBuffer !== 'function') {
            return Response.json({ success: false, error: 'No file provided' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        // Vercel's filesystem is read-only outside /tmp, so point tesseract's
        // traineddata cache there explicitly instead of its default cwd-based path.
        worker = await createWorker('eng', 1, { cachePath: '/tmp' })
        const { data } = await worker.recognize(buffer)
        const rawText = data?.text || ''
        const parsed = parseCaption(rawText)

        return Response.json({ success: true, rawText, ...parsed })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    } finally {
        if (worker) {
            try { await worker.terminate() } catch {}
        }
    }
}
