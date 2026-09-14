/**
 * Copy-paste WooCommerce (WordPress) -> Peeptoon integration.
 *
 * What this does: every time a WooCommerce order reaches "processing" or
 * "completed" status, this automatically books a shipment for it on
 * Peeptoon.
 *
 * You do NOT need to understand this file to use it. Follow
 * docs/WOOCOMMERCE_INTEGRATION.md in this repo step by step -- it tells you
 * exactly what to fill in below, how to run this, and how to set up the
 * matching webhook(s) in WooCommerce's own admin (WooCommerce > Settings >
 * Advanced > Webhooks -- no plugin needed).
 *
 * The only things you need to change are the 3 values in the "FILL THESE IN"
 * section right below.
 */

// ============ FILL THESE IN ============
const PEEPTOON_API_KEY = "PASTE_YOUR_PEEPTOON_API_KEY_HERE";
const PEEPTOON_PICKUP_WAREHOUSE = "PASTE_YOUR_PICKUP_ADDRESS_NAME_HERE";
// Must exactly match the "Secret" field on the webhook(s) you create in
// WooCommerce -- see Step 5 of the guide.
const WOOCOMMERCE_WEBHOOK_SECRET = "choose-any-random-password-here";
// =========================================

const express = require("express");
const crypto = require("crypto");
const Peeptoon = require("@peeptoon/sdk");

const peeptoon = new Peeptoon({ apiKey: PEEPTOON_API_KEY });
const app = express();

// WooCommerce signs the exact raw request body, so this captures it before
// Express's JSON parser touches it (same reason Shopify's example does this).
app.use(express.json({
    verify: (req, res, buf) => { req.rawBody = buf; },
}));

function isGenuinelyFromWooCommerce(req) {
    const sentSignature = req.get("X-WC-Webhook-Signature") || "";
    const expectedSignature = crypto
        .createHmac("sha256", WOOCOMMERCE_WEBHOOK_SECRET)
        .update(req.rawBody)
        .digest("base64");
    // Different lengths would throw inside timingSafeEqual.
    if (sentSignature.length !== expectedSignature.length) return false;
    return crypto.timingSafeEqual(
        Buffer.from(sentSignature),
        Buffer.from(expectedSignature)
    );
}

// WooCommerce's built-in Cash on Delivery gateway has the id "cod". A
// different/renamed COD plugin will use a different id -- check WooCommerce
// > Settings > Payments for yours and adjust this if needed.
function isCod(order) {
    return order.payment_method === "cod";
}

// Orders without a separate "ship to different address" only have billing
// filled in -- WooCommerce leaves shipping.address_1 etc. blank in that
// case, so this falls back to the billing address whenever shipping is
// empty.
function pick(shippingValue, billingValue) {
    return shippingValue || billingValue || "";
}

app.post("/webhooks/woocommerce/orders-create", async (req, res) => {
    // Always tell WooCommerce "got it" quickly -- it retries deliveries that
    // don't get a prompt response, which could double-book the same order.
    res.status(200).send("ok");

    if (!isGenuinelyFromWooCommerce(req)) {
        console.error("Rejected a webhook with an invalid signature.");
        return;
    }

    const order = req.body;

    // "Order created" fires the moment checkout starts, which for an online
    // payment method can be BEFORE payment actually succeeds. Only book once
    // the order is in a status that means payment is secured (COD orders go
    // straight to "processing" on creation and don't need a second event;
    // online-payment orders need the "Order updated" webhook from the guide
    // to reach this same handler again once they flip to "processing").
    if (order.status !== "processing" && order.status !== "completed") {
        console.log(`Skipping WooCommerce order #${order.number}, status is "${order.status}".`);
        return;
    }

    const billing = order.billing || {};
    const shipping = order.shipping || {};
    const cod = isCod(order);
    const amount = Number(order.total) || 0;

    try {
        const result = await peeptoon.orders.create({
            external_order_id: order.number || String(order.id),
            auto_assign: true, // let Peeptoon pick the cheapest available courier
            consignee: {
                name: pick(
                    [shipping.first_name, shipping.last_name].filter(Boolean).join(" "),
                    [billing.first_name, billing.last_name].filter(Boolean).join(" ")
                ) || "Customer",
                // Shipping addresses rarely carry a phone number in
                // WooCommerce -- billing.phone is the reliable source.
                phone: billing.phone || shipping.phone || "",
                address1: pick(shipping.address_1, billing.address_1),
                address2: pick(shipping.address_2, billing.address_2),
                city: pick(shipping.city, billing.city),
                state: pick(shipping.state, billing.state),
                pincode: pick(shipping.postcode, billing.postcode),
            },
            parcel: {
                // WooCommerce's order webhook payload doesn't include total
                // package weight -- 0.5kg is a placeholder default.
                weight: 0.5,
                length: 20,
                breadth: 15,
                height: 10,
            },
            payment: {
                mode: cod ? "COD" : "Prepaid",
                cod_amount: cod ? amount : 0,
                invoice_value: amount,
            },
            pickup_warehouse: PEEPTOON_PICKUP_WAREHOUSE,
            items: (order.line_items || []).map((item) => ({ name: item.name, qty: item.quantity })),
        });

        if (result.success === false) {
            console.error(`Peeptoon booking failed for WooCommerce order #${order.number}:`, result.message);
            return;
        }

        console.log(`Booked WooCommerce order #${order.number} on Peeptoon -- AWB ${result.awbNumber}`);

        // Optional next step (not included here): call WooCommerce's own
        // REST API (PUT /wp-json/wc/v3/orders/{id}) to write result.awbNumber
        // back as an order note or tracking field. See
        // docs/WOOCOMMERCE_INTEGRATION.md's "What's next" section.
    } catch (err) {
        console.error(`Peeptoon booking failed for WooCommerce order #${order.number}:`, err.message);
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening for WooCommerce order webhooks on port ${port}`);
});
