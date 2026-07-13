/**
 * Copy-paste Shopify -> Peeptoon integration.
 *
 * What this does: every time a new order is placed on your Shopify store,
 * this automatically books a shipment for it on Peeptoon.
 *
 * You do NOT need to understand this file to use it. Follow
 * docs/SHOPIFY_INTEGRATION.md in this repo step by step -- it tells you
 * exactly what to fill in below and how to run this.
 *
 * The only things you need to change are the 3 values in the "FILL THESE IN"
 * section right below.
 */

// ============ FILL THESE IN ============
const PEEPTOON_API_KEY = "PASTE_YOUR_PEEPTOON_API_KEY_HERE";
const PEEPTOON_PICKUP_WAREHOUSE = "PASTE_YOUR_PICKUP_ADDRESS_NAME_HERE";
// Optional but recommended -- see Step 4 in the guide. Leave as "" to skip
// signature verification while you're first testing this.
const SHOPIFY_WEBHOOK_SECRET = "";
// =========================================

const express = require("express");
const crypto = require("crypto");
const Peeptoon = require("@peeptoon/sdk");

const peeptoon = new Peeptoon({ apiKey: PEEPTOON_API_KEY });
const app = express();

// Shopify needs the exact raw request body to verify its signature, so this
// captures it before Express's JSON parser touches it.
app.use(express.json({
    verify: (req, res, buf) => { req.rawBody = buf; },
}));

function isGenuinelyFromShopify(req) {
    if (!SHOPIFY_WEBHOOK_SECRET) return true; // not set up yet -- allowed through
    const sentSignature = req.get("X-Shopify-Hmac-Sha256") || "";
    const expectedSignature = crypto
        .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
        .update(req.rawBody)
        .digest("base64");
    return sentSignature === expectedSignature;
}

// Shopify orders don't have a dedicated "is this COD" flag -- COD apps/
// payment methods on Shopify show up in gateway names instead, so this
// checks for the common ones. Add your own COD gateway's name here if yours
// isn't matched (search the printed order in your terminal for
// "payment_gateway_names" to see the exact name Shopify sent).
function isCod(order) {
    const gateways = (order.payment_gateway_names || []).join(" ").toLowerCase();
    return gateways.includes("cod") || gateways.includes("cash on delivery");
}

app.post("/webhooks/shopify/orders-create", async (req, res) => {
    // Always tell Shopify "got it" quickly -- it retries aggressively if you
    // don't, which could double-book the same order.
    res.status(200).send("ok");

    if (!isGenuinelyFromShopify(req)) {
        console.error("Rejected a webhook that didn't match the Shopify signature.");
        return;
    }

    const order = req.body;
    const address = order.shipping_address || {};
    const cod = isCod(order);

    try {
        const result = await peeptoon.orders.create({
            external_order_id: order.name || String(order.order_number || order.id),
            auto_assign: true, // let Peeptoon pick the cheapest available courier
            consignee: {
                name: [address.first_name, address.last_name].filter(Boolean).join(" ") || "Customer",
                phone: address.phone || order.phone || (order.customer && order.customer.phone) || "",
                address1: address.address1 || "",
                address2: address.address2 || "",
                city: address.city || "",
                state: address.province || "",
                pincode: address.zip || "",
            },
            parcel: {
                // Shopify gives total weight in grams; falls back to 0.5kg if
                // a product's weight was never set on Shopify's side.
                weight: order.total_weight ? order.total_weight / 1000 : 0.5,
                length: 20,
                breadth: 15,
                height: 10,
            },
            payment: {
                mode: cod ? "COD" : "Prepaid",
                cod_amount: cod ? Number(order.total_price) || 0 : 0,
                invoice_value: Number(order.total_price) || 0,
            },
            pickup_warehouse: PEEPTOON_PICKUP_WAREHOUSE,
            items: (order.line_items || []).map((item) => ({ name: item.name, qty: item.quantity })),
        });

        if (result.success === false) {
            console.error(`Peeptoon booking failed for Shopify order ${order.name}:`, result.message);
            return;
        }

        console.log(`Booked Shopify order ${order.name} on Peeptoon -- AWB ${result.awbNumber}`);

        // Optional next step (not included here): call Shopify's Fulfillment
        // API to write result.awbNumber back onto the Shopify order as a
        // tracking number. See docs/SHOPIFY_INTEGRATION.md's "What's next"
        // section.
    } catch (err) {
        console.error(`Peeptoon booking failed for Shopify order ${order.name}:`, err.message);
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening for Shopify order webhooks on port ${port}`);
});
