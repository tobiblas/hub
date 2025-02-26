const { getTemperature } = require('./getTemperature');
const { getElectricityPrice } = require('../electricityPrice/getElectricityPrice');
const { setRelay } = require('./relayController');
const { getProperty } = require('../properties/properties');
const { writeFileSync, appendFileSync} = require("fs");
const path = require("path");

const THRESHOLD_PRICE_HIGH = 2;
const THRESHOLD_PRICE_ULTRA_HIGH = 5;
const DATA_FILE = path.join(__dirname, 'data.json');

function clearLogFile() {
    try {
        writeFileSync(DATA_FILE, '', 'utf8');
    } catch (err) {
        logError('Error clearing log file:', err);
    }
}

async function main() {
    let temperature = await getTemperature();
    if (temperature === null) {
        logError("Error fetching temperature, turning relay ON for safety.");
        setRelay(true);
        return;
    }
    temperature = temperature.toFixed(1);
    logMessage("indoorTemp", temperature);
    const targetTemp = getProperty("targetTemp");
    logMessage("targetTemp", targetTemp);
    const electricityPrice = await getElectricityPrice();
    let currentPrice = 0;
    if (electricityPrice === null) {
        logError("Error fetching electricity price, will use 0 as current price");
    } else {
        //get current hour
        const now = new Date();
        const currentHour = now.getHours();
        currentPrice = electricityPrice[currentHour]?.total;
    }
    logMessage("electricityPrice", currentPrice);

    let threshold = getProperty("threshold");
    if (currentPrice > THRESHOLD_PRICE_HIGH && currentPrice < THRESHOLD_PRICE_ULTRA_HIGH) {
        threshold += 1;
    } else if (currentPrice >= THRESHOLD_PRICE_ULTRA_HIGH) {
        threshold += 4;
    }
    logMessage("threshold", threshold);

    if (temperature < targetTemp - threshold) {
        setRelay(true);
        logMessage("relayValue", "ON",true);
    } else {
        setRelay(false);
        logMessage("relayValue", "OFF", true);
    }
}

function log(message) {
    console.log(new Date() + ": " + message);
}
function logError(message, err) {
    console.error(new Date() + ": " + message, err);
}

function logMessageData(message) {
    const logEntry = `${message}\n`;
    try {
        appendFileSync(DATA_FILE, logEntry);
    } catch (err) {
        logError('Error writing to log file:', err);
    }
}
function logMessage(name, value, last) {
    const logEntry = `{"name": "${name}", "value": "${value}"}${last ? "" : ","}\n`;
    try {
        appendFileSync(DATA_FILE, logEntry);
    } catch (err) {
        logError('Error writing to log file:', err);
    }
}

async function run() {
    clearLogFile();
    logMessageData("{");
    logMessageData('"data": [');
    await main();
    logMessageData("],");
    logMessageData('"date": "' + new Date().toISOString().slice(0, 16).replace('T', ' ') + '"}');
}

run().catch(err => {
    logError("Error in main execution:", err);
});
