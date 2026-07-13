# Connect your Shopify store to Peeptoon (step by step, no coding experience needed)

This guide gets you a working setup where **every new Shopify order automatically books a shipment on Peeptoon** — no manual copy-pasting of orders.

You don't need to understand code to follow this. You're going to: download one ready-made file, fill in 2 blanks, run it, and connect it to Shopify. Total time: about 15-20 minutes.

## What you'll end up with

```
Customer orders on Shopify  →  Shopify tells our script  →  Script books it on Peeptoon
```

## Before you start, you'll need:

1. **A Peeptoon API key** — log in to your Peeptoon panel → **Settings** → **Developer API** → click **Generate API Key**. Copy it somewhere safe.
2. **Your pickup address name on Peeptoon** — the exact name of the pickup address you use when creating a shipment manually (Pickup Address page).
3. **Node.js installed on your computer** — if you don't have it, download it from [nodejs.org](https://nodejs.org) (choose the "LTS" version) and install it like any other program.
4. A free [Render.com](https://render.com) account (or similar) — this is where the script will run so Shopify can reach it. You could also run it on your own computer temporarily just to test, but it needs to be running 24/7 for real orders, which is what Render is for (free tier is enough to start).

## Step 1 — Get the files

Download this repository as a ZIP:
1. Go to https://github.com/Peeptoon/peeptoon-sdk
2. Click the green **Code** button → **Download ZIP**
3. Unzip it somewhere on your computer

The file you care about is `examples/shopify-order-webhook.js`.

## Step 2 — Fill in your details

Open `examples/shopify-order-webhook.js` in any text editor (even Notepad works). Right near the top you'll see:

```js
const PEEPTOON_API_KEY = "PASTE_YOUR_PEEPTOON_API_KEY_HERE";
const PEEPTOON_PICKUP_WAREHOUSE = "PASTE_YOUR_PICKUP_ADDRESS_NAME_HERE";
```

Replace the placeholder text (keeping the quotes) with:
- Your real API key from Step 0.1 above
- Your pickup address's exact name from Step 0.2 above

Save the file. **That's the only code you need to touch.**

## Step 3 — Install and test it on your computer

Open a terminal / command prompt in the `examples` folder (on Windows: open the folder, click the address bar, type `cmd`, press Enter) and run:

```bash
npm install
npm start
```

If you see `Listening for Shopify order webhooks on port 3000`, it worked. Press `Ctrl+C` to stop it for now — you'll run it for real once it's deployed (next step).

## Step 4 — Put it online (so Shopify can reach it)

Shopify needs to send its order notifications to a real internet address, not your personal computer. The easiest free way:

1. Push the `examples` folder to its own GitHub repository (or ask whoever set up your GitHub for help with this one step).
2. Go to [render.com](https://render.com), sign up, click **New +** → **Web Service**, connect that repository.
3. Set **Start Command** to `npm start`.
4. Click **Create Web Service**. Render gives you a URL like `https://your-app-name.onrender.com`.

Keep that URL — you'll use it in the next step.

## Step 5 — Tell Shopify to notify this script

In your Shopify Admin:
1. Go to **Settings** → **Notifications** → scroll to **Webhooks** → **Create webhook**.
2. **Event**: `Order creation`
3. **Format**: `JSON`
4. **URL**: your Render URL from Step 4 + `/webhooks/shopify/orders-create`, e.g. `https://your-app-name.onrender.com/webhooks/shopify/orders-create`
5. Save. Shopify will show you a **Signing secret** — copy it.

## Step 6 — (Recommended) Secure it

Back in `shopify-order-webhook.js`, paste that signing secret into:

```js
const SHOPIFY_WEBHOOK_SECRET = "paste_the_signing_secret_here";
```

This stops anyone else from being able to fake orders to your booking script. Save, then redeploy (push the change to GitHub — Render redeploys automatically).

## Step 7 — Test it for real

Place a test order on your Shopify store. Within a few seconds, check your Peeptoon panel's Orders page — you should see it show up booked, with an AWB number.

## Troubleshooting

- **Nothing happened**: In Shopify, go back to Settings → Notifications → Webhooks, click your webhook, and check "Recent deliveries" — it shows you exactly what was sent and whether it succeeded or failed.
- **"Rejected a webhook that didn't match the Shopify signature"** in your Render logs: the signing secret in Step 6 doesn't match what Shopify actually sent — copy it again carefully (no extra spaces).
- **Order shows up on Peeptoon but wrong weight/COD**: this script guesses at a few things Shopify doesn't directly provide (see the comments in `isCod()` inside the script) — you may need to adjust it for how your store is set up. Ask whoever helped you with GitHub/Render to tweak those few lines.

## What's next (optional, not included here)

This script books the shipment but doesn't write the tracking number back onto the Shopify order yet. That's a further step using Shopify's Fulfillment API — ask a developer to extend `shopify-order-webhook.js` for this if you want it.
