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
POSTEX_WEBHOOK_SECRET=...
```
`POSTEX_API_TOKEN` comes from the PostEx merchant dashboard → **Setting →
API Integration** — same page also has the "API Integration Guide" PDF this
was built against (`PostEx-COD_API_Integration_Guide_V4.1.9.pdf`, v4.1.9).

`POSTEX_WEBHOOK_SECRET` is one you generate yourself (any long random
string — a freshly-generated one is `e58b3f0985f4eff80f49852c0ae60beac3bc28f9c49d1a30`,
use that or make your own). It isn't sent to PostEx as a token; it's baked
into the callback URL you register with them, since PostEx doesn't document
a request-signing scheme the way Meta's webhooks do — an unguessable URL is
the whole auth story here.

No further PostEx-side setup is required for booking — pickup address
defaults to whatever's already configured on your PostEx account, and every
order is type "Normal" (not Reversed/Replacement).

### Registering the webhook

In the PostEx merchant dashboard, find the webhook/callback-URL setting
(under Setting → API Integration, or wherever they've placed it) and set it
to:
```
https://thekiddytrends.com/api/webhooks/postex/<POSTEX_WEBHOOK_SECRET>
```
using the same secret value from your env vars. If that setting isn't
present in the dashboard, PostEx may not offer push webhooks at all for
this account tier — in that case this still does nothing harmful, it just
never receives calls.

## What's built

- `lib/postexApi.js` — the API client (create order, track, cancel, cities,
  airway bill PDF, and `normalizePostExStatus` shared with the webhook).
- `/admin/instagram-orders` — the quick order form + recent orders list,
  print/cancel actions. Mirrored at `/employee/instagram-orders`.
- Every booked order is saved locally in the `instagram_orders` table
  (with PostEx's raw response) so there's a record even outside PostEx's
  own dashboard.
- `app/api/webhooks/postex/[secret]/route.js` — receives PostEx's push
  status updates. Every delivery is logged to `postex_webhook_log`
  (raw payload + whether the secret matched) *before* anything else happens,
  so a wrong secret or an unrecognized payload shape is visible in that
  table instead of silently vanishing. On a recognized event it updates
  `instagram_orders.order_status` (matched by `tracking_number`, falling
  back to `order_ref_number`) or `orders.status` (matched by scanning the
  `notes` field for the AWB, same as the pull-based tracker does, since
  `orders` never got a dedicated tracking-number column).
- **PostEx's actual push payload field names are unverified** — nothing in
  this repo or their public docs confirms the exact JSON shape, so
  `extractEvent()` in the webhook route guesses across several likely field
  names (`trackingNumber`/`transactionStatus`, matching what the pull API
  already confirmed works, plus common variants). Once real traffic lands,
  check `postex_webhook_log.raw_body` for what PostEx actually sends and
  tighten `extractEvent()` to match exactly.

## Not built yet

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
- A dedicated `orders.tracking_number` column — regular website orders still
  only carry the AWB inside the free-text `notes` field, which both the
  tracker and the webhook have to regex/scan for instead of reading a real
  column.
