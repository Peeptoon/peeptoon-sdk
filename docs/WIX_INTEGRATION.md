# Connect your Wix store to Peeptoon (step by step, no coding experience needed)

This guide gets you a working setup where **every new Wix order automatically books a shipment on Peeptoon** — no manual copy-pasting of orders.

You don't need to understand code to follow this. You're going to: download one ready-made file, fill in 2 blanks, run it, and connect it to Wix using a no-code **Automation**. Total time: about 20-25 minutes.

## What you'll end up with

```
Customer orders on Wix  →  Wix Automation sends a webhook  →  Script books it on Peeptoon
```

Unlike Shopify, Wix doesn't send order webhooks in a fixed format automatically — instead, **you** tell Wix exactly which order fields to send and what to name them, using Wix's own no-code **Automations** builder. That actually makes this more reliable: the script below expects specific field names, and you'll set Wix up to send exactly those names, so nothing gets lost in translation.

## Before you start, you'll need:

1. **A Peeptoon API key** — log in to your Peeptoon panel → **Settings** → **Developer API** → click **Generate API Key**. Copy it somewhere safe.
2. **Your pickup address name on Peeptoon** — the exact name of the pickup address you use when creating a shipment manually (Pickup Address page).
3. **Node.js installed on your computer** — if you don't have it, download it from [nodejs.org](https://nodejs.org) (choose the "LTS" version) and install it like any other program.
4. A free [Render.com](https://render.com) account (or similar) — this is where the script will run so Wix can reach it. You could also run it on your own computer temporarily just to test, but it needs to be running 24/7 for real orders, which is what Render is for (free tier is enough to start).
5. A Wix site with **Wix Stores** and access to **Automations** in your site's dashboard (Business & eCommerce plans and above include this).

## Step 1 — Get the files

Download this repository as a ZIP:
1. Go to https://github.com/Peeptoon/peeptoon-sdk
2. Click the green **Code** button → **Download ZIP**
3. Unzip it somewhere on your computer

The file you care about is `examples/wix-order-webhook.js`.

## Step 2 — Fill in your details

Open `examples/wix-order-webhook.js` in any text editor (even Notepad works). Right near the top you'll see:

```js
const PEEPTOON_API_KEY = "PASTE_YOUR_PEEPTOON_API_KEY_HERE";
const PEEPTOON_PICKUP_WAREHOUSE = "PASTE_YOUR_PICKUP_ADDRESS_NAME_HERE";
const WIX_WEBHOOK_SECRET = "choose-any-random-password-here";
```

Replace the placeholder text (keeping the quotes) with:
- Your real API key from the checklist above
- Your pickup address's exact name from the checklist above
- Any random password you make up (letters and numbers, no spaces) — you'll enter this exact same value into Wix in Step 6. This is how the script knows a request genuinely came from your Wix Automation and not from a stranger who found the URL.

Save the file. **That's the only code you need to touch.**

## Step 3 — Install and test it on your computer

Open a terminal / command prompt in the `examples` folder (on Windows: open the folder, click the address bar, type `cmd`, press Enter) and run:

```bash
npm install
npm run start:wix
```

If you see `Listening for Wix order webhooks on port 3000`, it worked. Press `Ctrl+C` to stop it for now — you'll run it for real once it's deployed (next step).

## Step 4 — Put it online (so Wix can reach it)

Wix needs to send its order notifications to a real internet address, not your personal computer. The easiest free way:

1. Push the `examples` folder to its own GitHub repository (or ask whoever set up your GitHub for help with this one step).
2. Go to [render.com](https://render.com), sign up, click **New +** → **Web Service**, connect that repository.
3. Set **Start Command** to `npm run start:wix`.
4. Click **Create Web Service**. Render gives you a URL like `https://your-app-name.onrender.com`.

Keep that URL — you'll use it in the next step. Your full webhook address is that URL plus `/webhooks/wix/orders-create`, e.g. `https://your-app-name.onrender.com/webhooks/wix/orders-create`.

## Step 5 — Create the Automation in Wix

In your Wix site's dashboard:
1. Go to **Automations** → **+ Create Automation** → **Start from Scratch**.
2. For the trigger, choose **Stores** → **Order Placed** (or similar wording — Wix occasionally renames these; search "order" if you don't see it immediately).
3. For the action, choose **Send a Webhook** (search "webhook" if it's not on the first screen).
4. Paste the URL from Step 4 as the webhook URL.

## Step 6 — Map the order fields Wix sends

Still in that **Send a Webhook** action, choose the **Custom Structure** option instead of "send all data" — this lets you pick exactly which fields go out, and name them yourself. Add one key-value pair per row below: type the **Key** exactly as shown (case-sensitive), then use the field picker/"Insert Variable" button to select the matching order field (search by the word in parentheses if you don't see it right away).

| Key (type exactly this) | Pick the order field for... |
|---|---|
| `orderId` | order number / ID |
| `customerName` | buyer's full name |
| `customerPhone` | buyer's phone |
| `addressLine1` | shipping address line 1 |
| `addressLine2` | shipping address line 2 (optional — skip if Wix doesn't offer one) |
| `city` | shipping address city |
| `state` | shipping address state/region |
| `pincode` | shipping address zip/postal code |
| `amount` | order total |
| `paymentMethod` | payment method / gateway (optional — skip if you don't see one; see Troubleshooting) |

Finally add one more row that is **not** from the order at all — just typed in directly:

| Key (type exactly this) | Value |
|---|---|
| `secret` | the same random password you put in `WIX_WEBHOOK_SECRET` in Step 2 |

Save and turn the Automation **on**.

## Step 7 — Test it for real

Place a test order on your Wix store. Within a few seconds, check your Peeptoon panel's Orders page — you should see it show up booked, with an AWB number.

## Troubleshooting

- **Nothing happened**: In Wix, open the Automation and check its run history/logs — it shows whether it fired and whether the webhook request succeeded.
- **"Rejected a webhook with the wrong secret"** in your Render logs: the `secret` value you typed into Wix's Custom Structure doesn't match `WIX_WEBHOOK_SECRET` in the script exactly — retype both carefully, no extra spaces.
- **Order shows up on Peeptoon but wrong weight/payment mode**: Wix Stores doesn't always expose a dedicated package weight or a clean "is this COD" flag the same way for every store setup — this script defaults weight to 0.5kg and payment to Prepaid unless you mapped `paymentMethod` and its value contains the word "cod". Ask a developer to adjust `guessIsCod()` and the default weight in `wix-order-webhook.js` to match how your store is actually configured.
- **Can't find "Order Placed" or "Send a Webhook" in Automations**: Wix periodically renames things in this builder — use the search box inside the automation editor and try "order" / "webhook".

## What's next (optional, not included here)

This script books the shipment but doesn't write the tracking number back onto the Wix order yet. That's a further step using Wix's own eCommerce/Fulfillments API — ask a developer to extend `wix-order-webhook.js` for this if you want it.
