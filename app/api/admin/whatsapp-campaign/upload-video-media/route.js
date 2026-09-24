import { uploadWhatsAppVideoMedia } from '../../../../../lib/whatsappApi'

export const dynamic = 'force-dynamic'

// Uploads the campaign's single video (already sitting in our own Storage,
// from the same signed-upload flow product videos use) to WhatsApp's Media
// API once, up front — the resulting media id is then reused for every
// recipient in the send loop, same pattern as the carousel's upload-media.
export async function POST(request) {
    try {
        const { videoUrl } = await request.json()
        if (!videoUrl) {
            return Response.json({ success: false, error: 'videoUrl is required' }, { status: 400 })
        }

        const result = await uploadWhatsAppVideoMedia(videoUrl)
        if (!result.success) {
            return Response.json({ success: false, error: result.error }, { status: 502 })
        }

        return Response.json({ success: true, mediaId: result.mediaId })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
