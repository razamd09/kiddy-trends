# WhatsApp Business automation — setup

The code side is done: order confirmation (on checkout) and every order status
change (processing / dispatched / delivered / cancelled), from either the
admin or employee Orders page, now attempt a real WhatsApp send via the Cloud
API instead of only offering a manual "click wa.me and press send" link. The
manual "📲 Send WhatsApp Update" button stays as a fallback either way.

Until the steps below are done, sends fail silently (logged server-side only)
and nothing else breaks — checkout and order updates keep working normally.

## 1. Add the WhatsApp product to the Meta app

Use the same Meta Business Account / App already set up for the Instagram
integration (business.facebook.com). In that app's dashboard, add the
**WhatsApp** product if it isn't already there.

Decide on the sender number:
- **Recommended**: use a *new* number dedicated to automated messages, so the
  existing +923360677340 keeps working as a normal WhatsApp number for staff
  to read/reply to customers by hand.
- Reusing the existing number is possible but requires Meta's "coexistence"
  migration and has tradeoffs — skip this unless you specifically want it.

## 2. Get credentials

In WhatsApp > API Setup in the Meta app dashboard:
- Copy the **Phone Number ID**.
- Generate a **permanent token**: Business Settings > Users > System Users >
  create one, assign it to the app with `whatsapp_business_messaging`
  permission, generate a token with no expiry. (The temporary token shown by
  default on the API Setup page expires in 24h — don't use that one long-term.)

Add to `.env.local` and to the Vercel project's environment variables:
```
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
```

## 3. Submit message templates for approval

Business-initiated messages (anything not a reply within 24h of the customer's
last message) must use a pre-approved template — free text isn't allowed.
In WhatsApp Manager > Message Templates > Create Template, submit these 5,
category **Utility**, language **English** (plain "English", not "English (US)" —
the code sends with language code `en` to match), body exactly as shown
(`{{1}}` = customer's first name, `{{2}}` = order number):

| Template name | Body |
|---|---|
| `order_pending_kt` | Hi {{1}}! We've received your Kiddy Trends order {{2}} and it's being reviewed. We'll update you shortly. 🧸 |
| `order_processing_kt` | Hi {{1}}! Your Kiddy Trends order {{2}} is confirmed and being packed. 📦 |
| `order_dispatched_kt` | Hi {{1}}! 🚚 Your Kiddy Trends order {{2}} has been dispatched and is on its way. Track it anytime at thekiddytrends.com/order-tracking |
| `order_delivered_kt` | Hi {{1}}! ✅ Your Kiddy Trends order {{2}} has been delivered. We hope your little one loves it! We'd love it if you left a quick review at thekiddytrends.com 💛 |
| `order_cancelled_kt` | Hi {{1}}, your Kiddy Trends order {{2}} has been cancelled. If this wasn't expected, please reply here and we'll sort it out right away. |

Approval is usually minutes to ~24h. The names must match exactly —
`lib/whatsappApi.js`'s `ORDER_STATUS_TEMPLATES` map references them by name.

## 4. WhatsApp Broadcast (New Arrivals campaign)

`/admin/whatsapp-broadcast` sends a **Carousel Template** — an intro line plus
up to 5 swipeable cards, each with a product image, price line, and a "View
Product" button — to every customer in the `customers` table. This is a
**Marketing**-category message (not Utility like the order updates above),
which has stricter rules:

- Recipients must have opted in to receive promotional WhatsApp messages —
  having simply placed an order does not count as marketing consent under
  WhatsApp's Commerce Policy. Confirm this before your first send, or Meta
  may restrict the number.
- A brand-new WhatsApp Business number starts on a lower daily messaging
  tier (unique conversations/24h) that scales up automatically based on
  quality rating and usage — a very large first broadcast may not fully
  deliver until the tier grows.

Card images are uploaded to WhatsApp's Media API automatically by the code at
send time (Cloud API does not accept a plain public image URL in a template
send, only a pre-uploaded media id) — nothing extra needed here for that part.

Submit this template for approval (category **Marketing**, language
**English**, type **Carousel** in the template editor — a different type from
the plain "Default" templates above):

**Template name**: `new_arrivals_carousel_kt`

**Body** (the intro text above the cards, `{{1}}` = first name):
```
Hi {{1}}! 🎉 New arrivals just dropped at Kiddy Trends — check them out below 👇
```

**Carousel — 5 cards**, every card identical in structure (Meta requires this):
- **Header**: image (any placeholder image works for the approval sample —
  the real ones are swapped in per-send by the code)
- **Body**: one variable, `{{1}}` — e.g. sample value `Cute Winter Frock – PKR 2,199`
- **Button**: one URL button, base URL `https://thekiddytrends.com/`, with a
  variable suffix — sample value `products/prd_id=123`. Label it something
  like "View Product".

Marketing templates typically take longer to review than Utility ones and
may be rejected if they read as spammy — keep the approved wording/structure
close to this if Meta asks for changes, since the code depends on exactly
this shape (1 intro variable, 5 cards each with 1 body variable + 1 button
variable).

## Not built yet (possible next steps)

- Auto-replying to inbound customer messages (needs a webhook receiver route).
- Abandoned-cart nudges.
- Tracking marketing opt-in/opt-out per customer (the broadcast above
  currently messages everyone with a phone number on file — see the policy
  note above).
