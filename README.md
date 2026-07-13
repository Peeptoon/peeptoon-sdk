# peeptoon-sdk

Official Node.js SDK for the Peeptoon Developer API — create and track shipments, get rate quotes, and manage your account programmatically (e.g. from a Shopify app, a custom store, or any backend integration).

## Install

```bash
npm install @peeptoon/sdk
```

## Getting an API key

Log in to your Peeptoon panel, go to **Settings → Developer API**, and click **Generate API Key**. Keep it secret — anyone with it can book/cancel shipments and read your order data.

## Quickstart

```js
const Peeptoon = require("@peeptoon/sdk");

const peeptoon = new Peeptoon({
  apiKey: process.env.PEEPTOON_API_KEY,
  // Optional — defaults to https://api.peeptoon.com/api/v1
  // baseURL: "https://your-panel-domain.com/api/v1",
});

const order = await peeptoon.orders.create({
  external_order_id: "SHOPIFY-1024",
  courier: "delhivery",
  // omit `courier` and set auto_assign instead to let Peeptoon pick the
  // cheapest serviceable courier for this shipment
  auto_assign: false,
  consignee: {
    name: "Divya Arora",
    phone: "9821654657",
    address1: "205, Dr. Mukherjee Nagar",
    city: "Delhi",
    state: "Delhi",
    pincode: "110009",
  },
  parcel: { weight: 0.5, length: 20, breadth: 15, height: 10 },
  payment: { mode: "Prepaid" },
  pickup_warehouse: "My Warehouse Name",
  items: [{ name: "T-Shirt", qty: 1 }],
});
```

Every call resolves with the raw parsed JSON body the server returned, or throws an `Error` (with the server's own `message`) on a non-2xx response or network failure.

## API

All methods are async and return the raw response body from the server.

### `peeptoon.orders`

```js
await peeptoon.orders.create(data);        // POST /orders
await peeptoon.orders.list({ status: "booked", page: 1 }); // GET /orders
await peeptoon.orders.get(orderId);         // GET /orders/:orderId
await peeptoon.orders.cancel(orderId);      // POST /orders/:orderId/cancel
```

### `peeptoon.rates`

```js
await peeptoon.rates.get({
  pickup_pincode: "110009",
  delivery_pincode: "400001",
  weight: 1.5,
  length: 20,
  width: 15,
  height: 10,
  payment_mode: "Prepaid", // or "COD"
  cod_amount: 0,
  receiver_state: "Maharashtra",
});
// -> { success: true, recommended: {courier, price, eta}, rates: [...] }
```

### `peeptoon.tracking`

```js
await peeptoon.tracking.get(awb); // GET /tracking/:awb
```

### `peeptoon.couriers`

```js
await peeptoon.couriers.list(); // GET /couriers -- couriers enabled on your account
```

### `peeptoon.labels`

```js
await peeptoon.labels.get(orderId); // GET /orders/:orderId/label
```

### `peeptoon.account`

```js
await peeptoon.account.get(); // GET /account
```

## Authentication

Every request sends `Authorization: Bearer <apiKey>` and `Content-Type: application/json` (handled for you — see `src/utils.js`). There's nothing else to configure.

## Errors

A non-2xx response rejects with an `Error` whose `message` is the server's own error message (`response.data.message`) when available, or the HTTP status text otherwise:

```js
try {
  await peeptoon.orders.get("does-not-exist");
} catch (err) {
  console.error(err.message); // e.g. "Order not found"
}
```

## License

MIT
