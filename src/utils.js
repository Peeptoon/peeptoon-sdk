const axios = require("axios");

async function request(client, method, url, data = null) {
    try {

        const response = await axios({
            method,
            url: client.baseURL + url,
            data,
            headers: {
                Authorization: `Bearer ${client.apiKey}`,
                "Content-Type": "application/json"
            }
        });

        return response.data;

    } catch (err) {

        if (err.response) {
            throw new Error(
                err.response.data?.message ||
                err.response.statusText
            );
        }

        throw err;
    }
}

module.exports = {
    request
};