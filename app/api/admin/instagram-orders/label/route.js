import { getAirwayBillPdf } from '../../../../../lib/postexApi'

export const dynamic = 'force-dynamic'

// Proxies PostEx's Airway Bill PDF — the browser can't call PostEx directly
// since that requires our secret API token.
export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const trackingNumbers = (searchParams.get('trackingNumbers') || '').split(',').map((t) => t.trim()).filter(Boolean)

    if (trackingNumbers.length === 0) {
        return Response.json({ success: false, error: 'trackingNumbers is required' }, { status: 400 })
    }

    const result = await getAirwayBillPdf(trackingNumbers)
    if (!result.success) {
        return Response.json({ success: false, error: result.error }, { status: 502 })
    }

    return new Response(result.pdfBuffer, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="postex-label.pdf"',
        },
    })
}
