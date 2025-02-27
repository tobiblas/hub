const axios = require('axios');
const { getProperty } = require("../properties/properties");
const { logError } = require("../common/logger");

const IP = getProperty("thermometerRaspberryIP");
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 10000; // 1 second in milliseconds

async function getTemperatureWithRetry(retries = 0) {
    try {
        const response = await axios.get('http://' + IP + '/thermometer/current_temp.php', { timeout: 5000 });
        const kelvin = parseFloat(response.data);
        const celsius = kelvin - 273.15;
        return celsius;
    } catch (error) {
        if (retries >= MAX_RETRIES) {
            logError("Max retries reached. Failed to fetch temperature:", error.message);
            return null;
        }
        const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retries);
        logError(`Failed to fetch temperature (attempt ${retries + 1}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return getTemperatureWithRetry(retries + 1);
    }
}

module.exports = { getTemperature: getTemperatureWithRetry };