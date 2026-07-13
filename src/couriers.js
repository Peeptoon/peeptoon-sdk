const { request } = require("./utils");

class Couriers {

    constructor(client) {
        this.client = client;
    }

    /**
     * List couriers enabled on this account
     */
    async list() {

        return request(
            this.client,
            "GET",
            "/couriers"
        );

    }

}

module.exports = Couriers;
