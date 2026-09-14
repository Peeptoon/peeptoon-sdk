/**
 * Copy-paste Wix -> Peeptoon integration.
 *
 * What this does: every time a new order is placed on your Wix store, this
 * automatically books a shipment for it on Peeptoon.
 *
 * You do NOT need to understand this file to use it. Follow
 * docs/WIX_INTEGRATION.md in this repo step by step -- it tells you exactly
 * what to fill in below, how to run this, and how to set up the matching
 * Wix Automation that sends orders here.
 *
 * Unlike Shopify (which sends a fixed webhook payload), a Wix Automation's
 * "Send a Webhook" action lets the store owner choose the JSON key names
 * themselves via a Custom Structure field picker -- so this script expects
 * the exact key names docs/WIX_INTEGRATION.md's Step 6 table tells you to
 * type into Wix, rather than guessing at Wix's internal order schema.
 *
 * The only things you need to change are the 3 values in the "FILL THESE IN"
 * section right below.
 */

// ============ FILL THESE IN ============
const PEEPTOON_API_KEY = "PASTE_YOUR_PEEPTOON_API_KEY_HERE";
const PEEPTOON_PICKUP_WAREHOUSE = "PASTE_YOUR_PICKUP_ADDRESS_NAME_HERE";
// Must exactly match the "secret" value you type into Wix's Custom
// Structure in Step 6 of the guide -- Wix doesn't sign outgoing webhooks the
// way Shopify does, so this shared value is what proves a request genuinely
// came from your Wix Automation.
const WIX_WEBHOOK_SECRET = "choose-any-random-password-here";
// =========================================

const express = require("express");
const crypto = require("crypto");
const Peeptoon = require("@peeptoon/sdk");

const peeptoon = new Peeptoon({ apiKey: PEEPTOON_API_KEY });
const app = express();

app.use(express.json());

function isGenuinelyFromWix(req) {
    const sent = Buffer.from(String(req.body.secret || ""));
    const expected = Buffer.from(WIX_WEBHOOK_SECRET);
    // Different lengths would throw inside timingSafeEqual, so that case is
    // simply "not a match" rather than a crash.
    if (sent.length !== expected.length) return false;
    return crypto.timingSafeEqual(sent, expected);
}

// Wix Stores doesn't expose a single reliable "is this COD" flag through the
// Automation field picker for every store (COD is usually a separate
// payment-provider app) -- so this only trusts an explicit `paymentMethod`
// key if the store owner mapped one in Step 6, and otherwise assumes
// Prepaid. Adjust this if your store's COD app names things differently.
function guessIsCod(body) {
    return String(body.paymentMethod || "").toLowerCase().includes("cod");
}

app.post("/webhooks/wix/orders-create", async (req, res) => {
    // Always tell Wix "got it" quickly -- automations can retry if a
    // response doesn't come back promptly, which could double-book the same
    // order.
    res.status(200).send("ok");

    if (!isGenuinelyFromWix(req)) {
        console.error("Rejected a webhook with the wrong secret.");
        return;
    }

    const body = req.body;
    const cod = guessIsCod(body);
    const amount = Number(body.amount) || 0;

    try {
        const result = await peeptoon.orders.create({
            external_order_id: body.orderId || "",
            auto_assign: true, // let Peeptoon pick the cheapest available courier
            consignee: {
                name: body.customerName || "Customer",
                phone: body.customerPhone || "",
                address1: body.addressLine1 || "",
                address2: body.addressLine2 || "",
                city: body.city || "",
                state: body.state || "",
                pincode: body.pincode || "",
            },
            parcel: {
                // Wix doesn't reliably surface a package weight through the
                // Automation field picker -- 0.5kg is a placeholder default.
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
        });

        if (result.success === false) {
            console.error(`Peeptoon booking failed for Wix order ${body.orderId}:`, result.message);
            return;
        }

        console.log(`Booked Wix order ${body.orderId} on Peeptoon -- AWB ${result.awbNumber}`);

        // Optional next step (not included here): call Wix's eCommerce/
        // Fulfillments API to write result.awbNumber back onto the Wix order
        // as a tracking number. See docs/WIX_INTEGRATION.md's "What's next"
        // section.
    } catch (err) {
        console.error(`Peeptoon booking failed for Wix order ${body.orderId}:`, err.message);
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening for Wix order webhooks on port ${port}`);
});
