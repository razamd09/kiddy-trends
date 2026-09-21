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
category **Utility**, language **English (US)**, body exactly as shown
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

`/admin/whatsapp-broadcast` sends a promotional message to every customer in
the `customers` table, listing the 5 newest active New Arrivals with links.
This is a **Marketing**-category message (not Utility like the order updates
above), which has stricter rules:

- Recipients must have opted in to receive promotional WhatsApp messages —
  having simply placed an order does not count as marketing consent under
  WhatsApp's Commerce Policy. Confirm this before your first send, or Meta
  may restrict the number.
- A brand-new WhatsApp Business number starts on a lower daily messaging
  tier (unique conversations/24h) that scales up automatically based on
  quality rating and usage — a very large first broadcast may not fully
  deliver until the tier grows.

Submit this template for approval (category **Marketing**, language
**English (US)**):

**Template name**: `new_arrivals_broadcast_kt`

**Body** (`{{1}}` = first name, `{{2}}`–`{{6}}` = one "title – link" line each
for the 5 featured products):
```
Hi {{1}}! 🎉 New arrivals just dropped at Kiddy Trends:

{{2}}
{{3}}
{{4}}
{{5}}
{{6}}

Shop the full collection: thekiddytrends.com/collections
```

Marketing templates typically take longer to review than Utility ones and
may be rejected if they read as spammy — keep the approved wording close to
this if Meta asks for changes, since the code fills these exact 6 slots.

## Not built yet (possible next steps)

- Auto-replying to inbound customer messages (needs a webhook receiver route).
- Abandoned-cart nudges.
- Tracking marketing opt-in/opt-out per customer (the broadcast above
  currently messages everyone with a phone number on file — see the policy
  note above).
