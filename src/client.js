const Orders = require("./orders");
const Tracking = require("./tracking");
const Rates = require("./rates");
const Couriers = require("./couriers");
const Labels = require("./labels");
const Account = require("./account");

class Peeptoon {

    constructor(options = {}) {

        if (!options.apiKey)
            throw new Error("apiKey required");

        this.apiKey = options.apiKey;

        this.baseURL =
            options.baseURL ||
            "https://api.peeptoon.com/api/v1";

        this.orders = new Orders(this);
        this.tracking = new Tracking(this);
        this.rates = new Rates(this);
        this.couriers = new Couriers(this);
        this.labels = new Labels(this);
        this.account = new Account(this);

    }

}

module.exports = Peeptoon;