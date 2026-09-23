// Temporary diagnostic endpoint — testing why get-operational-city returns
// 400. Delete once resolved.
const BASE_URL = 'https://api.postex.pk/services/integration/api/order'

async function tryFetch(label, path) {
    try {
        const res = await fetch(BASE_URL + path, {
            headers: { 'Content-Type': 'application/json', token: process.env.POSTEX_API_TOKEN },
        })
        const text = await res.text()
        let parsed
        try { parsed = JSON.parse(text) } catch { parsed = text.slice(0, 300) }
        return { label, status: res.status, body: parsed }
    } catch (err) {
        return { label, error: err.message }
    }
}

export async function GET() {
    const results = await Promise.all([
        tryFetch('no-param', '/v2/get-operational-city'),
        tryFetch('Delivery', '/v2/get-operational-city?operationalCityType=Delivery'),
        tryFetch('delivery-lower', '/v2/get-operational-city?operationalCityType=delivery'),
        tryFetch('Origin', '/v2/get-operational-city?operationalCityType=Origin'),
        tryFetch('Both', '/v2/get-operational-city?operationalCityType=Both'),
    ])
    return Response.json({ results })
}
