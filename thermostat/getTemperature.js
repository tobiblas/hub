const axios = require('axios');
const {getProperty} = require("../properties/properties");

const IP = getProperty("thermometerRaspberryIP");
async function getTemperature() {
    try {
        const response = await axios.get('http://' + IP + '/thermometer/current_temp.php', { timeout: 5000 });
        const kelvin = parseFloat(response.data);
        if (isNaN(kelvin)) throw new Error("Invalid temperature data received");
        const celsius = kelvin - 273.15;
        return celsius;
    } catch (error) {
        console.error("Failed to fetch temperature:", error.message);
        return null; // Return null to indicate failure
    }
}

module.exports = { getTemperature };
