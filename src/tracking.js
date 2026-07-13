const { request } = require("./utils");

class Tracking {

    constructor(client) {
        this.client = client;
    }

    /**
     * Track a shipment by AWB
     */
    async get(awb) {

        return request(
            this.client,
            "GET",
            `/tracking/${awb}`
        );

    }

}

module.exports = Tracking;
