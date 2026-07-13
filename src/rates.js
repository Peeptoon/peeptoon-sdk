const { request } = require("./utils");

class Rates {

    constructor(client) {
        this.client = client;
    }

    /**
     * Get courier rate quotes for a shipment.
     *
     * payload: { pickup_pincode, delivery_pincode, weight, length, width,
     * height, payment_mode, cod_amount, receiver_state }
     */
    async get(payload) {

        return request(
            this.client,
            "POST",
            "/rates",
            payload
        );

    }

}

module.exports = Rates;
