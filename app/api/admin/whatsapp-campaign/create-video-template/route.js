import { createVideoTemplate } from '../../../../../lib/whatsappApi'

const SITE_URL = 'https://thekiddytrends.com'

// One-time setup call — creates the single-video promo template directly via
// the API. Body wording deliberately keeps {{2}} (the catchy tagline) short
// relative to the surrounding static text — Meta rejects a template whose
// variable dominates the message length (learned the hard way with the
// carousel templates). Needs a real sample video URL (any short MP4 works
// for Meta's review) passed in the POST body.
export async function POST(request) {
    const { sampleVideoUrl } = await request.json().catch(() => ({}))
    if (!sampleVideoUrl) {
        return Response.json({ success: false, error: 'sampleVideoUrl is required' }, { status: 400 })
    }

    const result = await createVideoTemplate({
        name: 'single_video_promo_kt',
        languageCode: 'en',
        bodyText: '✨ {{1}} ✨\n\nOur latest video is here — tap below to watch and shop the look on our website! 🛍️👇',
        bodyExample: 'New Winter Drop Just Landed!',
        buttonBaseUrl: SITE_URL + '/',
        buttonExample: 'collections',
        sampleVideoUrl,
    })

    return Response.json(result, { status: result.success ? 200 : 502 })
}
