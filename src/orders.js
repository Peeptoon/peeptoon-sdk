const { request } = require("./utils");

class Orders {

    constructor(client) {
        this.client = client;
    }

    /**
     * Create Order
     */
    async create(data) {
        return request(
            this.client,
            "POST",
            "/orders",
            data
        );
    }

    /**
     * List Orders
     */
    async list(params = {}) {

        const query = new URLSearchParams(params).toString();

        return request(
            this.client,
            "GET",
            "/orders" + (query ? `?${query}` : "")
        );

    }

    /**
     * Get Order
     */
    async get(orderId) {

        return request(
            this.client,
            "GET",
            `/orders/${orderId}`
        );

    }

    /**
     * Cancel Order
     */
    async cancel(orderId) {

        return request(
            this.client,
            "POST",
            `/orders/${orderId}/cancel`
        );

    }

}

module.exports = Orders;