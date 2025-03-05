const axios = require("axios");
const logger = require("./logger.js");

async function controlShelly(action, shellyIp) {
    const url = `http://${shellyIp}/relay/0?turn=${action}`;
    try {
        const response = await axios.get(url); // Use axios for the GET request
        logger.log(`Shelly turned ${action}: ${response.status}`);
    } catch (error) {
        logger.logError(`Failed to turn ${action} Shelly:`, error.message);
    }
}

module.exports = { controlShelly };
