# Instagram DM auto-capture setup

Captures every new Instagram DM automatically from the moment it's turned
on — view them at `/admin/instagram-conversations`. This is real-time only:
**Meta's API has no way to fetch past conversation history**, so anything
sent before this is live has to be read manually (there is no workaround).

## 1. Add environment variables

Add to `.env.local` and Vercel:
```
INSTAGRAM_APP_SECRET=...          # App settings > Basic > App Secret (KiddyWtsap app)
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=... # any string you make up yourself, e.g. a random password
```
(`INSTAGRAM_ACCESS_TOKEN` should already be set from the Instagram feed
integration — it's reused here to look up a sender's @username.)

## 2. Configure the webhook in Meta

In the app dashboard: **Use cases → Manage messaging & content on Instagram
→ Customize → API setup with Instagram login → "3. Configure webhooks"**.

- **Callback URL**: `https://thekiddytrends.com/api/webhooks/instagram`
- **Verify token**: the same value you put in `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`
- Subscribe to the **`messages`** field.

Note the page itself said *"To receive webhooks, your app must be in
published state"* — the app currently shows "Unpublished" (Publish tab),
so this needs to be published before real customer messages will actually
arrive, on top of the Advanced Access approval for
`instagram_business_manage_messages` (queued in App Review, not yet
submitted — see below).

## 3. App Review (for real customers, not just testers)

`instagram_business_manage_messages` is currently **Standard Access**
("Ready for testing") — it only works for Instagram accounts added as
Testers on this app (App roles → Roles → add as Instagram Tester). To
receive messages from real customers, it needs **Advanced Access**, which
means submitting for Meta App Review:

1. The permission is already queued (App Review → Permissions and
   Features → "Not submitted" → visible under "New requests").
2. Before submitting: record a short screen capture showing the feature
   working end to end (conversation appears in `/admin/instagram-conversations`
   after a test message is sent).
3. Fill in the use-case justification (what it does, why it needs the
   permission) and the app's Privacy Policy URL, which must disclose that
   customer messages are processed — including by AI — to extract
   shipping/order details for fulfillment.
4. Submit. Meta's review timeline is their own — commonly a few days, not
   guaranteed on the first attempt.

## What's built so far

- `app/api/webhooks/instagram/route.js` — receives and verifies webhook
  events, stores every message in `instagram_messages` (grouped into
  `instagram_conversations` per customer), and keeps the raw payload of
  *every* webhook delivery in `instagram_webhook_log` as a safety net
  (Meta payload shapes for this newer Instagram-Login messaging flow
  weren't fully documented at build time — this raw log lets us adjust
  parsing after seeing real traffic without losing anything).
- `/admin/instagram-conversations` — browse captured conversations and
  read the message thread for each.

## Not built yet

- **AI extraction into the PostEx quick-order form** — reads a
  conversation and pre-fills name/phone/address/city/items on
  `/admin/instagram-orders`. Needs an Anthropic API key (from
  console.anthropic.com — a separate thing from a Claude Code
  subscription, pay-per-use, very cheap for this) as `ANTHROPIC_API_KEY`.
  Picks up here once that key exists.
