import { getOperationalCities } from '../../../../../lib/postexApi'

export async function GET() {
    const result = await getOperationalCities('Delivery')
    if (!result.success) return Response.json({ success: false, error: result.error }, { status: 502 })
    return Response.json({ success: true, cities: result.cities })
}
