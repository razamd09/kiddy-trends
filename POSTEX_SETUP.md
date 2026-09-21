# PostEx quick-order setup

`/admin/instagram-orders` (and `/employee/instagram-orders`) is a fast form
for booking Instagram COD orders directly with PostEx, replacing manually
retyping each order into PostEx's own web form. Fill in what the customer
sent you on Instagram, click "Book Order", and it creates the shipment with
PostEx and gives you a "Print Label" button for the Airway Bill — same PDF
you'd hand to the rider.

## Setup

Add to `.env.local` and to Vercel's environment variables:
```
POSTEX_API_TOKEN=...
```
Get it from the PostEx merchant dashboard → **Setting → API Integration** —
same page also has the "API Integration Guide" PDF this was built against
(`PostEx-COD_API_Integration_Guide_V4.1.9.pdf`, v4.1.9).

No further PostEx-side setup is required — pickup address defaults to
whatever's already configured on your PostEx account, and every order is
type "Normal" (not Reversed/Replacement).

## What's built

- `lib/postexApi.js` — the API client (create order, track, cancel, cities,
  airway bill PDF).
- `/admin/instagram-orders` — the quick order form + recent orders list,
  print/cancel actions. Mirrored at `/employee/instagram-orders`.
- Every booked order is saved locally in the `instagram_orders` table
  (with PostEx's raw response) so there's a record even outside PostEx's
  own dashboard.

## Not built yet (the bigger, second half of this project)

- **Auto-reading Instagram DMs** to pre-fill the form. This form still
  requires a human to read the Instagram conversation and type in the
  details — it only replaces the PostEx-side retyping, not the Instagram
  reading. Building DM auto-read needs:
  - The Instagram Messaging API wired up (webhook receiver + permissions —
    the app already shows "Manage messaging & content on Instagram" as a
    customized use case, which is a head start).
  - An extraction step (AI-assisted) to pull name/phone/address/items out of
    free-form chat text — never auto-booked without a human reviewing and
    confirming first, since a wrong address or wrong COD amount is costly.
- Webhook-based status sync (PostEx can push delivery-status updates to a
  URL we configure in their dashboard) — right now `/admin/instagram-orders`
  only shows the status as of booking time, not live updates.
