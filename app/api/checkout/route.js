export async function POST(request) {
  try {
    const { cartItems, customer } = await request.json()

    const lineItems = cartItems.map(item => ({
      variant_id: item.variantId,
      quantity:   item.quantity,
    }))

    const draftOrder = {
      line_items: lineItems,
      shipping_address: {
        first_name: customer.name.split(' ')[0],
        last_name:  customer.name.split(' ').slice(1).join(' ') || customer.name,
        address1:   customer.address,
        city:       customer.city,
        country:    'Pakistan',
        phone:      customer.phone,
      },
      billing_address: {
        first_name: customer.name.split(' ')[0],
        last_name:  customer.name.split(' ').slice(1).join(' ') || customer.name,
        address1:   customer.address,
        city:       customer.city,
        country:    'Pakistan',
        phone:      customer.phone,
      },
      email:  customer.email || '',
      phone:  customer.phone,
      note:   'WhatsApp: ' + customer.whatsapp + (customer.notes ? ' | Notes: ' + customer.notes : ''),
      tags:   'COD, Website Order',
      send_invoice: false,
    }

    const res = await fetch(
      'https://' + process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN + '/admin/api/2024-01/draft_orders.json',
      {
        method: 'POST',
        headers: {
          'Content-Type':           'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN,
        },
        body: JSON.stringify({ draft_order: draftOrder }),
      }
    )

    const data = await res.json()

    if (data.errors) {
      return Response.json({ success: false, error: JSON.stringify(data.errors) }, { status: 400 })
    }

    if (!data.draft_order) {
      return Response.json({ success: false, error: 'Failed to create order' }, { status: 500 })
    }

    // Complete the draft order so it appears as a real order in Shopify Admin
    const completeRes = await fetch(
      'https://' + process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN + '/admin/api/2024-01/draft_orders/' + data.draft_order.id + '/complete.json?payment_pending=true',
      {
        method: 'PUT',
        headers: {
          'Content-Type':           'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN,
        },
      }
    )

    const completeData = await completeRes.json()

    return Response.json({
      success:   true,
      orderId:   completeData.draft_order?.order_id,
      orderName: completeData.draft_order?.name,
    })

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}