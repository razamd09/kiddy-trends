# Kiddy Trends 🧸

A cute & playful Next.js website for a kids clothing brand (Newborn – 12 Years).

## Pages
- **Home** — Hero, age categories, featured products, features, email signup
- **Collections** — Filterable product grid (by age + category)
- **About Us** — Brand story, values, team
- **Refund Policy** — Full returns & exchange policy
- **Size Chart** — Interactive size tables by age group

## Brand Colors (from logo)
| Name      | Hex       | Usage                    |
|-----------|-----------|--------------------------|
| Coral     | `#E8635A` | Primary, CTA, badges     |
| Sky Blue  | `#A8D4E6` | Newborn category, cards  |
| Slate     | `#7B8FA6` | Dark accents             |
| Sunny     | `#E8D96A` | Highlights, banners      |
| Mint      | `#7EC8B8` | Kids category, accents   |
| Cream     | `#F0EDE4` | Background               |
| Charcoal  | `#2D2D2D` | Body text                |

## Fonts
- **Display:** Fredoka One (headings, brand name)
- **Body:** Nunito (all body text, buttons)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Order Email Notification

When an order is placed, the backend sends a notification email via EmailJS.

Set these environment variables in Vercel:

- `ORDER_NOTIFICATION_EMAIL` (default: `thekiddytrends@gmail.com`)
- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`

## PostEx Tracking Integration

Order tracking now supports live courier status from PostEx when an AWB/tracking number is saved on the order.

Optional environment variables:

- `POSTEX_TRACKING_URL` (default: `https://postex.pk/api/tracking-order`)
- `POSTEX_BEARER_TOKEN`
- `POSTEX_API_KEY`
- `POSTEX_CLIENT_ID`
- `POSTEX_CLIENT_SECRET`

## To Add Your Logo
Your logo is already saved at `public/logo.jpg` and used across the site.

## Customise
- Update contact details in `components/Footer.js`
- Add real products in `app/collections/page.js`
- Update the WhatsApp number (search for `923000000000`)
- Replace placeholder team photos in `app/about/page.js`
