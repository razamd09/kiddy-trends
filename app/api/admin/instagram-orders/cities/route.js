import { getOperationalCities } from '../../../../../lib/postexApi'

export async function GET() {
    // PostEx rejects a capitalized value here with a 400 ("Delivery") —
    // confirmed live, only lowercase works.
    const result = await getOperationalCities('delivery')
    if (!result.success) return Response.json({ success: false, error: result.error }, { status: 502 })
    return Response.json({ success: true, cities: result.cities })
}
