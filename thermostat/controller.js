const { getTemperature } = require('./getTemperature');
const { getElectricityPrice } = require('../electricityPrice/getElectricityPrice');
const { setRelay } = require('./relayController');
const { getProperty } = require('../properties/properties');

const THRESHOLD_PRICE_HIGH = 2;
const THRESHOLD_PRICE_ULTRA_HIGH = 5;

async function main() {
    const temperature = await getTemperature();
    console.log("Current temperature:", temperature);
    if (temperature === null) {
        console.log("Error fetching temperature, turning relay ON for safety.");
        setRelay(true);
        return;
    }

    const electricityPrice = await getElectricityPrice();
    let currentPrice = 0;
    if (electricityPrice === null) {
        console.log("Error fetching electricity price, will use 0 as current price");
    } else {
        //get current hour
        const now = new Date();
        const currentHour = now.getHours();
        currentPrice = electricityPrice[currentHour]?.total;
    }
    console.log("Electricity price:", currentPrice);

    let threshold = getProperty("threshold");
    if (currentPrice > THRESHOLD_PRICE_HIGH && currentPrice < THRESHOLD_PRICE_ULTRA_HIGH) {
        threshold += 1;
    } else if (currentPrice >= THRESHOLD_PRICE_ULTRA_HIGH) {
        threshold += 4;
    }

    console.log("Threshold:", threshold);
    // Replace with actual logic for relay control
    const targetTemp = getProperty("targetTemp");

    if (temperature < targetTemp - threshold) {
        setRelay(true);
    } else {
        setRelay(false);
    }
}

main();
