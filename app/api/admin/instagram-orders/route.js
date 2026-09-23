import { createClient } from '@supabase/supabase-js'
import { createOrder, getPickupAddresses } from '../../../../lib/postexApi'
import { normalizePhone, splitName, upsertCustomers } from '../customers/customer-data'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

// PostEx requires every order to carry a pickup (or store) address code —
// the warehouse/pickup location is the same for every order regardless of
// where it's shipping to, so just use whichever one is registered first.
let cachedPickupAddressCode = null
async function resolvePickupAddressCode() {
    if (cachedPickupAddressCode) return cachedPickupAddressCode
    const result = await getPickupAddresses()
    if (!result.success || !result.addresses?.length) return null
    cachedPickupAddressCode = result.addresses[0].addressCode
    return cachedPickupAddressCode
}

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200)

    const { data, error } = await supabase
        .from('instagram_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
    return Response.json({ success: true, orders: data || [] })
}

// Books directly with PostEx — no separate "draft" step, since the whole
// point is replacing the slow manual retype into PostEx's own form with one
// button. The order is only saved locally once PostEx has actually accepted it.
export async function POST(request) {
    try {
        const body = await request.json()
        const {
            customerName, customerPhone, cityName, deliveryAddress,
            orderDetail, items, invoicePayment, transactionNotes, instagramUsername,
        } = body

        if (!customerName || !customerPhone || !cityName || !deliveryAddress || !invoicePayment) {
            return Response.json({ success: false, error: 'Customer name, phone, city, address and COD amount are all required' }, { status: 400 })
        }

        const orderRefNumber = '786-KT-' + Date.now().toString(36).toUpperCase()
        const pickupAddressCode = await resolvePickupAddressCode()
        if (!pickupAddressCode) {
            return Response.json({ success: false, error: 'No pickup address registered with PostEx — add one in your PostEx merchant dashboard first' }, { status: 502 })
        }

        const result = await createOrder({
            orderRefNumber,
            customerName,
            customerPhone,
            cityName,
            deliveryAddress,
            orderDetail,
            items,
            invoicePayment,
            transactionNotes,
            pickupAddressCode,
        })

        if (!result.success) {
            return Response.json({ success: false, error: result.error }, { status: 502 })
        }

        const { data, error } = await supabase
            .from('instagram_orders')
            .insert([{
                order_ref_number: orderRefNumber,
                customer_name: customerName,
                customer_phone: customerPhone,
                city_name: cityName,
                delivery_address: deliveryAddress,
                order_detail: orderDetail || '',
                items: Number(items) || 1,
                invoice_payment: Number(invoicePayment) || 0,
                transaction_notes: transactionNotes || '',
                instagram_username: String(instagramUsername || '').replace(/^@/, ''),
                tracking_number: result.trackingNumber || null,
                order_status: result.orderStatus || null,
                postex_response: result,
                booked_at: new Date().toISOString(),
            }])
            .select()
            .single()

        if (error) {
            // PostEx already booked it — surface the tracking number even if
            // our own local save failed, so it isn't silently lost.
            return Response.json({
                success: true,
                warning: 'Order booked with PostEx but failed to save locally: ' + error.message,
                trackingNumber: result.trackingNumber,
            })
        }

        // Every booked order is also a customer record — the book-order
        // screen is effectively the "add customer" flow now, so there's no
        // separate manual step needed to get them into the Customers list.
        const normalizedPhone = normalizePhone(customerPhone)
        if (normalizedPhone) {
            await upsertCustomers([{
                ...splitName(customerName),
                phone: normalizedPhone,
                address: deliveryAddress,
                instagram_username: String(instagramUsername || '').replace(/^@/, ''),
                order_source: 'Insta',
                updated_at: new Date().toISOString(),
            }])
        }

        return Response.json({ success: true, order: data })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
