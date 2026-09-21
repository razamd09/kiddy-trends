// PostEx Merchant API client — replaces manually retyping each Instagram
// order into PostEx's own web form with a direct booking call.
//
// Setup required (see POSTEX_SETUP.md at the repo root):
//   POSTEX_API_TOKEN - from PostEx merchant dashboard > Setting > API Integration
//
// Reference: PostEx-COD_API_Integration_Guide_V4.1.9.pdf (merchant dashboard).
// Every endpoint takes the token as a `token` header, not Bearer auth.

const BASE_URL = 'https://api.postex.pk/services/integration/api/order'

function isConfigured() {
    return Boolean(process.env.POSTEX_API_TOKEN)
}

async function postexFetch(path, { method = 'GET', body, query } = {}) {
    if (!isConfigured()) {
        return { success: false, error: 'PostEx API not configured (missing POSTEX_API_TOKEN)' }
    }

    let url = BASE_URL + path
    if (query) {
        const params = new URLSearchParams(query)
        url += '?' + params.toString()
    }

    try {
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                token: process.env.POSTEX_API_TOKEN,
            },
            body: body ? JSON.stringify(body) : undefined,
        })

        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/pdf')) {
            if (!res.ok) return { success: false, error: 'PostEx API error ' + res.status }
            const buffer = Buffer.from(await res.arrayBuffer())
            return { success: true, pdfBuffer: buffer }
        }

        const data = await res.json().catch(() => ({}))
        if (!res.ok || (data.statusCode && data.statusCode !== '200')) {
            return { success: false, error: data?.statusMessage || ('PostEx API error ' + res.status) }
        }
        return { success: true, data }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

export async function getOperationalCities(operationalCityType) {
    const result = await postexFetch('/v2/get-operational-city', {
        query: operationalCityType ? { operationalCityType } : undefined,
    })
    if (!result.success) return result
    return { success: true, cities: result.data?.dist || [] }
}

export async function getPickupAddresses(cityName) {
    const result = await postexFetch('/v1/get-merchant-address', {
        query: cityName ? { cityName } : undefined,
    })
    if (!result.success) return result
    return { success: true, addresses: result.data?.dist || [] }
}

// orderRefNumber must be unique per order — the caller generates it (e.g.
// "IG" + our own row id) so it can be used to reconcile against PostEx later.
export async function createOrder({
    orderRefNumber, customerName, customerPhone, cityName, deliveryAddress,
    invoicePayment, orderDetail, items, transactionNotes, pickupAddressCode,
}) {
    const result = await postexFetch('/v3/create-order', {
        method: 'POST',
        body: {
            orderRefNumber,
            customerName,
            customerPhone,
            cityName,
            deliveryAddress,
            invoicePayment: Number(invoicePayment) || 0,
            orderDetail: orderDetail || '',
            items: Number(items) || 1,
            invoiceDivision: 1,
            orderType: 'Normal',
            transactionNotes: transactionNotes || '',
            pickupAddressCode: pickupAddressCode || undefined,
        },
    })
    if (!result.success) return result
    return { success: true, ...result.data?.dist }
}

export async function trackOrder(trackingNumber) {
    const result = await postexFetch('/v1/track-order/' + encodeURIComponent(trackingNumber))
    if (!result.success) return result
    return { success: true, ...result.data?.dist }
}

export async function cancelOrder(trackingNumber) {
    return postexFetch('/v1/cancel-order', { method: 'PUT', body: { trackingNumber } })
}

// Up to 10 tracking numbers per call (PostEx limit) — returns the raw
// Airway Bill PDF bytes for printing.
export async function getAirwayBillPdf(trackingNumbers) {
    const list = (Array.isArray(trackingNumbers) ? trackingNumbers : [trackingNumbers]).slice(0, 10)
    return postexFetch('/v1/getinvoice', { query: { trackingNumbers: list.join(',') } })
}
