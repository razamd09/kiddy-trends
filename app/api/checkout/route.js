const STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN

async function shopifyFetch(query, variables) {
  const res = await fetch(`https://${STORE_DOMAIN}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  })
  return res.json()
}

export async function POST(request) {
  try {
    const { cartItems, customer } = await request.json()

    const lineItems = cartItems.map(item => ({
      variantId: `gid://shopify/ProductVariant/${item.variantId}`,
      quantity: item.quantity,
    }))

    const createCheckout = `
      mutation checkoutCreate($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
          checkout {
            id
            webUrl
            totalPriceV2 { amount currencyCode }
          }
          checkoutUserErrors { message field }
        }
      }
    `

    const checkoutInput = {
      lineItems,
      shippingAddress: {
        firstName: customer.name.split(' ')[0],
        lastName:  customer.name.split(' ').slice(1).join(' ') || customer.name,
        address1:  customer.address,
        city:      customer.city,
        country:   'PK',
        phone:     customer.phone,
      },
      email: customer.email || customer.phone + '@kiddytrends.com',
      note:  customer.notes || '',
    }

    const { data } = await shopifyFetch(createCheckout, { input: checkoutInput })

    if (data?.checkoutCreate?.checkoutUserErrors?.length > 0) {
      return Response.json({
        success: false,
        error: data.checkoutCreate.checkoutUserErrors[0].message
      }, { status: 400 })
    }

    const checkout = data?.checkoutCreate?.checkout
    if (!checkout) {
      return Response.json({ success: false, error: 'Failed to create checkout' }, { status: 500 })
    }

    return Response.json({
      success: true,
      checkoutId:  checkout.id,
      checkoutUrl: checkout.webUrl,
      total:       checkout.totalPriceV2?.amount,
    })

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}