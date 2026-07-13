const { request } = require("./utils");

class Labels {

    constructor(client) {
        this.client = client;
    }

    /**
     * Get the shipping label for a booked order
     */
    async get(orderId) {

        return request(
            this.client,
            "GET",
            `/orders/${orderId}/label`
        );

    }

}

module.exports = Labels;
