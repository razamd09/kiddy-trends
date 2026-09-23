import { uploadWhatsAppMedia } from '../../../../../lib/whatsappApi'

// Uploads each selected card's image to WhatsApp's Media API once, up front,
// before a campaign send starts — the resulting media ids are then reused
// across every recipient's carousel message instead of re-uploading per send.
export async function POST(request) {
    try {
        const { images } = await request.json()
        if (!Array.isArray(images) || images.length === 0) {
            return Response.json({ success: false, error: 'images is required' }, { status: 400 })
        }

        const results = await Promise.all(images.map(async (img) => {
            const result = await uploadWhatsAppMedia(img.url)
            return { id: img.id, success: result.success, mediaId: result.mediaId || null, error: result.error || null }
        }))

        return Response.json({ success: true, results })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
