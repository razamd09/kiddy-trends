import { trackOrder } from '../../../../../lib/postexApi'

// One-off diagnostic to see PostEx's real track-order response shape —
// not linked from any UI, safe to remove after use.
export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const trackingNumber = searchParams.get('trackingNumber')
    if (!trackingNumber) return Response.json({ success: false, error: 'trackingNumber required' }, { status: 400 })
    const result = await trackOrder(trackingNumber)
    return Response.json(result)
}
