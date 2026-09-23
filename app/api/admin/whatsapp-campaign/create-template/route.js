import { createCarouselTemplate } from '../../../../../lib/whatsappApi'

const SITE_URL = 'https://thekiddytrends.com'

// One-time setup call — creates the new_arrivals_carousel_kt template
// directly via the API, since this account's Manage Templates UI doesn't
// offer a Carousel type at all. Safe to call again if it fails partway;
// Meta rejects a duplicate name outright rather than creating a second copy.
export async function GET() {
    const result = await createCarouselTemplate({
        name: 'new_arrivals_carousel_kt',
        languageCode: 'en',
        bodyText: 'Hi {{1}}! 🎉 New arrivals just dropped at Kiddy Trends — check them out below 👇',
        bodyExample: 'Sara',
        cardCount: 5,
        cardBodyExample: 'Cute Winter Frock – PKR 2,199',
        buttonBaseUrl: SITE_URL + '/',
        buttonExample: 'products/prd_id=123',
        sampleImageUrl: SITE_URL + '/logo.jpg',
    })

    return Response.json(result, { status: result.success ? 200 : 502 })
}
