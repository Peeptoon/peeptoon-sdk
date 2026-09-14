# Connect your WooCommerce (WordPress) store to Peeptoon (step by step, no coding experience needed)

This guide gets you a working setup where **every new WooCommerce order automatically books a shipment on Peeptoon** — no manual copy-pasting of orders.

You don't need to understand code to follow this. You're going to: download one ready-made file, fill in 3 blanks, run it, and connect it to WooCommerce's own built-in Webhooks feature (no plugin needed). Total time: about 15-20 minutes.

## What you'll end up with

```
Customer orders on WooCommerce  →  WordPress sends a webhook  →  Script books it on Peeptoon
```

## Before you start, you'll need:

1. **A Peeptoon API key** — log in to your Peeptoon panel → **Settings** → **Developer API** → click **Generate API Key**. Copy it somewhere safe.
2. **Your pickup address name on Peeptoon** — the exact name of the pickup address you use when creating a shipment manually (Pickup Address page).
3. **Node.js installed on your computer** — if you don't have it, download it from [nodejs.org](https://nodejs.org) (choose the "LTS" version) and install it like any other program.
4. A free [Render.com](https://render.com) account (or similar) — this is where the script will run so WordPress can reach it. You could also run it on your own computer temporarily just to test, but it needs to be running 24/7 for real orders, which is what Render is for (free tier is enough to start).
5. Admin access to your WordPress site's dashboard, with WooCommerce installed and orders already working normally.

## Step 1 — Get the files

Download this repository as a ZIP:
1. Go to https://github.com/Peeptoon/peeptoon-sdk
2. Click the green **Code** button → **Download ZIP**
3. Unzip it somewhere on your computer

The file you care about is `examples/woocommerce-order-webhook.js`.

## Step 2 — Fill in your details

Open `examples/woocommerce-order-webhook.js` in any text editor (even Notepad works). Right near the top you'll see:

```js
const PEEPTOON_API_KEY = "PASTE_YOUR_PEEPTOON_API_KEY_HERE";
const PEEPTOON_PICKUP_WAREHOUSE = "PASTE_YOUR_PICKUP_ADDRESS_NAME_HERE";
const WOOCOMMERCE_WEBHOOK_SECRET = "choose-any-random-password-here";
```

Replace the placeholder text (keeping the quotes) with:
- Your real API key from the checklist above
- Your pickup address's exact name from the checklist above
- Any random password you make up (letters and numbers, no spaces) — you'll enter this exact same value into WooCommerce in Step 5. WooCommerce uses this to sign every webhook so the script can tell it's genuinely from your store.

Save the file. **That's the only code you need to touch.**

## Step 3 — Install and test it on your computer

Open a terminal / command prompt in the `examples` folder (on Windows: open the folder, click the address bar, type `cmd`, press Enter) and run:

```bash
npm install
npm run start:woocommerce
```

If you see `Listening for WooCommerce order webhooks on port 3000`, it worked. Press `Ctrl+C` to stop it for now — you'll run it for real once it's deployed (next step).

## Step 4 — Put it online (so WordPress can reach it)

WooCommerce needs to send its order notifications to a real internet address, not your personal computer. The easiest free way:

1. Push the `examples` folder to its own GitHub repository (or ask whoever set up your GitHub for help with this one step).
2. Go to [render.com](https://render.com), sign up, click **New +** → **Web Service**, connect that repository.
3. Set **Start Command** to `npm run start:woocommerce`.
4. Click **Create Web Service**. Render gives you a URL like `https://your-app-name.onrender.com`.

Keep that URL — you'll use it in the next step. Your full webhook address is that URL plus `/webhooks/woocommerce/orders-create`, e.g. `https://your-app-name.onrender.com/webhooks/woocommerce/orders-create`.

## Step 5 — Create the webhook in WooCommerce

In your WordPress dashboard:
1. Go to **WooCommerce → Settings → Advanced → Webhooks**.
2. Click **Add webhook**.
3. **Name**: anything, e.g. "Peeptoon booking".
4. **Status**: Active.
5. **Topic**: `Order created`.
6. **Delivery URL**: the full webhook address from Step 4.
7. **Secret**: the exact same random password you put in `WOOCOMMERCE_WEBHOOK_SECRET` in Step 2.
8. **API version**: leave on the latest (WP REST API Integration v3).
9. Click **Save webhook**.

**Recommended second webhook**: repeat the same steps but with **Topic**: `Order updated`, same Delivery URL and Secret. Why: WooCommerce creates the order record — and fires "Order created" — the moment checkout starts, which can be *before* an online payment actually succeeds. The script already ignores anything that isn't `processing` or `completed`, so this second webhook is what lets it pick the order back up once payment actually clears (a Cash on Delivery order usually goes straight to `processing` on creation and doesn't need this, but card/UPI/wallet orders do).

## Step 6 — Test it for real

Place a test order on your WooCommerce store (use a real payment method or COD, not just "add to cart"). Within a few seconds of it reaching `processing` or `completed` status, check your Peeptoon panel's Orders page — you should see it show up booked, with an AWB number.

## Troubleshooting

- **Nothing happened**: Go back to **WooCommerce → Settings → Advanced → Webhooks**, click your webhook, and scroll down to its delivery logs — it shows exactly what was sent and the response your script gave back.
- **"Rejected a webhook with an invalid signature"** in your Render logs: the Secret in WooCommerce doesn't exactly match `WOOCOMMERCE_WEBHOOK_SECRET` in the script — retype both carefully, no extra spaces.
- **Orders never book**: check the order's status in WooCommerce. The script only books orders that are `processing` or `completed` — a `pending payment` or `failed` order is deliberately skipped. Make sure you set up the "Order updated" webhook from Step 5 too, so a status change after checkout still reaches the script.
- **Wrong weight**: WooCommerce doesn't include package weight in the webhook payload at all — this script defaults every shipment to 0.5kg. Ask a developer to adjust the default in `woocommerce-order-webhook.js` if that's consistently wrong for your products.
- **Wrong "COD" detection**: this script treats WooCommerce's built-in `cod` (Cash on Delivery) payment gateway as COD and everything else as Prepaid. If you use a different/renamed COD plugin, ask a developer to adjust `isCod()` in the script to match your gateway's ID (check **WooCommerce → Settings → Payments** for the exact gateway ID).

## What's next (optional, not included here)

This script books the shipment but doesn't write the tracking number back onto the WooCommerce order yet. That's a further step using WooCommerce's own REST API (`PUT /wp-json/wc/v3/orders/{id}`) to add the AWB as an order note or a tracking plugin's custom field — ask a developer to extend `woocommerce-order-webhook.js` for this if you want it.
