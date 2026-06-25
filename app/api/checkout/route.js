import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { cartItems, customer } = await request.json()

    // Calculate totals
    const subtotal = cartItems.reduce((s, i) => s + (parseFloat(i.price || 0) * i.quantity), 0)
    const shipping  = 250
    const total     = subtotal + shipping

    // Save to Supabase FIRST — this is our primary system now
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    )

    const { data: savedOrder, error: supabaseError } = await supabase
        .from('orders')
        .insert([{
          customer_name:     customer.name,
          customer_phone:    customer.phone,
          customer_whatsapp: customer.whatsapp || customer.phone,
          customer_email:    customer.email || '',
          customer_city:     customer.city,
          customer_address:  customer.address,
          items:             cartItems,
          subtotal,
          shipping,
          discount:          0,
          total,
          status:            'pending',
          notes:             customer.notes || '',
        }])
        .select()
        .single()

    if (supabaseError) {
      console.log('Supabase error:', supabaseError)
      return Response.json({ success: false, error: 'Failed to save order' }, { status: 500 })
    }

    // Try Shopify in background — if it fails, order is already saved
    try {
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
        email:        customer.email || '',
        phone:        customer.phone,
        note:         'WhatsApp: ' + (customer.whatsapp || customer.phone) + (customer.notes ? ' | Notes: ' + customer.notes : ''),
        tags:         'COD, Website Order',
        send_invoice: false,
      }

      const res = await fetch(
          'https://' + process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN + '/admin/api/2024-01/draft_orders.json',
          {
            method:  'POST',
            headers: {
              'Content-Type':           'application/json',
              'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN,
            },
            body: JSON.stringify({ draft_order: draftOrder }),
          }
      )

      const data = await res.json()

      if (data.draft_order) {
        // Complete draft order
        const completeRes = await fetch(
            'https://' + process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN + '/admin/api/2024-01/draft_orders/' + data.draft_order.id + '/complete.json?payment_pending=true',
            {
              method:  'PUT',
              headers: {
                'Content-Type':           'application/json',
                'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN,
              },
            }
        )
        const completeData = await completeRes.json()

        // Update Supabase with Shopify order ID
        if (completeData.draft_order?.order_id) {
          await supabase
              .from('orders')
              .update({ shopify_order_id: String(completeData.draft_order.order_id) })
              .eq('id', savedOrder.id)
        }
      }
    } catch (shopifyError) {
      console.log('Shopify sync failed (order saved in Supabase):', shopifyError.message)
    }

    return Response.json({
      success:  true,
      orderId:  savedOrder.id,
      orderName: '#KT-' + savedOrder.id,
    })

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}