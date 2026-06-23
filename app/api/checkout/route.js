const STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN

async function shopifyFetch(query, variables) {
  const res = await fetch('https://' + STORE_DOMAIN + '/api/2024-01/graphql.json', {
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

    const lines = cartItems.map(item => ({
      merchandiseId: 'gid://shopify/ProductVariant/' + item.variantId,
      quantity: item.quantity,
    }))

    const createCart = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
            cost {
              totalAmount { amount currencyCode }
            }
          }
          userErrors { message field }
        }
      }
    `

    const cartInput = {
      lines,
      buyerIdentity: {
        phone: customer.phone,
        deliveryAddressPreferences: [{
          deliveryAddress: {
            firstName: customer.name.split(' ')[0],
            lastName:  customer.name.split(' ').slice(1).join(' ') || customer.name,
            address1:  customer.address,
            city:      customer.city,
            country:   'PK',
            phone:     customer.phone,
          }
        }]
      },
      note: customer.notes || '',
      attributes: [
        { key: 'customer_name',  value: customer.name },
        { key: 'customer_phone', value: customer.phone },
        { key: 'city',           value: customer.city },
        { key: 'address',        value: customer.address },
        { key: 'payment_method', value: customer.payment || 'cod' },
      ]
    }

    const { data } = await shopifyFetch(createCart, { input: cartInput })

    if (data?.cartCreate?.userErrors?.length > 0) {
      return Response.json({
        success: false,
        error: data.cartCreate.userErrors[0].message,
      }, { status: 400 })
    }

    const cart = data?.cartCreate?.cart

    if (!cart) {
      return Response.json({
        success: false,
        error: 'Failed to create cart',
      }, { status: 500 })
    }

    return Response.json({
      success: true,
      cartId:      cart.id,
      checkoutUrl: cart.checkoutUrl,
      total:       cart.cost?.totalAmount?.amount,
    })

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}