# Connecting Shopsy to Peeptoon

This is **not** a copy-paste, no-code guide like [Shopify](SHOPIFY_INTEGRATION.md) or [Wix](WIX_INTEGRATION.md). Read this first before promising a customer a quick turnaround.

## Why this one is different

Shopsy isn't an independent storefront platform — it's built on **Flipkart's own seller infrastructure**. There's no Shopsy-specific API; integrating with Shopsy means integrating with the **Flipkart Marketplace Seller API (FMSAPI)**, and that comes with real gatekeeping Shopify/Wix don't have:

| | Shopify / Wix | Shopsy (via Flipkart) |
|---|---|---|
| Getting access | Self-serve, instant, no approval | Apply through Flipkart's **Partner Dashboard**, wait ~72 hours for review |
| Who can set it up | The store owner, no code | A developer, working against a real API |
| Auth | A signing secret / a password you invent | Full OAuth 2.0 — register an app, get an App ID + App Secret, exchange them for a Bearer token that expires (~60 days) and must be refreshed |
| Getting notified of new orders | A no-code webhook you configure yourself in minutes | Two options, both harder (see below) |
| Marking a shipment as booked | Not needed — Peeptoon owns the whole flow | A separate call back into Flipkart's system to attach the courier + AWB to their order |

Sources: [Flipkart Marketplace Seller API docs](https://seller.flipkart.com/api-docs/FMSAPI.html), [Order Management Notification Service](https://seller.flipkart.com/api-docs/order-api-docs/NotifIntro.html)

## The two ways to find out about new orders

**1. Push notifications (webhooks) — the "right" way long-term, but slow to set up**

Flipkart will push shipment-lifecycle events (creation, label creation, cancellation, etc.) to a URL you host — but only after you:
- Stand up an HTTPS endpoint
- Obtain a **VAPT certificate** (a formal third-party penetration-test report — not something you generate yourself, and not fast)
- Sign an NDA
- Raise a support ticket to Flipkart with your Seller ID, receiver URL, VAPT + NDA certificates, location IDs, and App ID/Secret
- Once approved, notifications arrive signed with `X_Date` / `X_Authorization` headers you must verify against your OAuth credentials

This is a real infosec + legal step, not a settings toggle. Budget for it as its own workstream, not part of a "connect your store" afternoon.

**2. Polling — realistic starting point**

Call `POST https://api.flipkart.net/sellers/v3/shipments/filter` on a schedule (e.g. every few minutes) with your OAuth Bearer token to pull recently created shipments, and book any you haven't seen yet on Peeptoon. This only needs the basic self-seller OAuth app (`client_credentials` grant) — no VAPT/NDA needed — so it's the practical thing to build first.

## What's still unconfirmed (why there's no script here yet)

Flipkart's field-level schema — the exact JSON keys for buyer name/phone, shipping address, pincode, line items, COD vs. prepaid, and the endpoint/fields for writing a courier name + AWB back onto their order — isn't in the publicly accessible docs; it's revealed once you're approved as a partner and can see the full reference. Writing a `wix-order-webhook.js`-style script against guessed field names would very likely just break silently for whoever runs it, so it's intentionally not included here.

## Recommended next steps

1. Apply for API access on Flipkart's **Partner Dashboard** (Profile → Manage API Access) as the Shopsy seller.
2. Once approved, pull the real field-level Shipment/Order API reference from the seller docs portal (only visible post-approval).
3. Come back with those docs (or share seller-portal access) — at that point building a `examples/shopsy-order-poll.js` (polling script, mirroring `shopify-order-webhook.js`'s structure but on a timer instead of a webhook route) against confirmed field names is straightforward: same `peeptoon.orders.create({ auto_assign: true, ... })` call at the core, just a different way of discovering new orders.
4. Decide separately whether the VAPT/NDA push-notification path is worth pursuing later to replace polling, once volume justifies it.

## In the meantime

Nothing stops the seller from using Peeptoon directly today: book manually in the panel, or use [`@peeptoon/sdk`](../README.md) from any internal tool that already has access to their Shopsy/Flipkart order data (e.g. an internal spreadsheet-driven script), even before the live API integration is built.
