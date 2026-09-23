import { createCarouselTemplate } from '../../../../../lib/whatsappApi'

const SITE_URL = 'https://thekiddytrends.com'

// One-time setup call — creates a Carousel template directly via the API,
// since this account's Manage Templates UI doesn't offer a Carousel type at
// all. Safe to call again if it fails partway; Meta rejects a duplicate name
// outright rather than creating a second copy.
//
// new_arrivals_carousel_kt (5 cards) is already live and stays in use for
// sends until new_arrivals_carousel_kt_10 (10 cards, submitted below) is
// actually APPROVED by Meta — swapping the send route over to an
// unapproved/pending template would break every send until then. Check
// approval status in WhatsApp Manager → Manage Templates, then update
// TEMPLATE_NAME in app/api/admin/whatsapp-campaign/route.js and
// MAX_PRODUCTS/PRODUCT_SLOTS in the broadcast page + that same route once
// it's approved.
export async function GET() {
    const result = await createCarouselTemplate({
        name: 'new_arrivals_carousel_kt_10',
        languageCode: 'en',
        bodyText: 'Hi {{1}}! 🎉 New arrivals just dropped at Kiddy Trends — check them out below 👇',
        bodyExample: 'Sara',
        cardCount: 10,
        cardBodyExample: 'Cute Winter Frock – PKR 2,199',
        buttonBaseUrl: SITE_URL + '/',
        buttonExample: 'products/prd_id=123',
        sampleImageUrl: SITE_URL + '/logo.jpg',
    })

    return Response.json(result, { status: result.success ? 200 : 502 })
}
