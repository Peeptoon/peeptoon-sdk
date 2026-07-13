const { request } = require("./utils");

class Account {

    constructor(client) {
        this.client = client;
    }

    /**
     * Get the authenticated account's profile
     */
    async get() {

        return request(
            this.client,
            "GET",
            "/account"
        );

    }

}

module.exports = Account;
