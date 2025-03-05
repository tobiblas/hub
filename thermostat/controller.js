const { getTemperature } = require('./getTemperature');
const { getElectricityPrice } = require('../electricityPrice/getElectricityPrice');
const { setRelay, isRelayOn} = require('../common/relayController');
const { getProperty } = require('../properties/properties');
const { writeFileSync, appendFileSync, renameSync } = require("fs");
const { logError, log } = require("../common/logger");
const path = require("path");

const THRESHOLD_PRICE_HIGH = 2;
const THRESHOLD_PRICE_ULTRA_HIGH = 5;
const DATA_FILE = path.join(__dirname, 'data.json');
const DATA_FILE_TMP = path.join(__dirname, 'data.json_tmp');

function clearLogFile() {
    try {
        writeFileSync(DATA_FILE_TMP, '', 'utf8');
    } catch (err) {
        logError('Error clearing log file:', err);
    }
}

async function main() {
    let temperature = await getTemperature();
    if (!temperature) {
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

    let threshold = 0;
    if (currentPrice > THRESHOLD_PRICE_HIGH && currentPrice < THRESHOLD_PRICE_ULTRA_HIGH) {
        threshold += 1;
    } else if (currentPrice >= THRESHOLD_PRICE_ULTRA_HIGH) {
        threshold += 4;
    }
    logMessage("threshold", threshold);

    const HYSTERESIS = 0.2; // 0.2 degrees difference between ON and OFF thresholds

    if (isRelayOn()) {
        // If relay is ON, use upper threshold to turn OFF
        if (temperature >= targetTemp - threshold + HYSTERESIS) {
            setRelay(false);
            logMessage("relayValue", "OFF", true);
        } else {
            setRelay(true);
            logMessage("relayValue", "ON", true);
        }
    } else {
        // If relay is OFF, use lower threshold to turn ON
        if (temperature < targetTemp - threshold - HYSTERESIS) {
            setRelay(true);
            logMessage("relayValue", "ON", true);
        } else {
            setRelay(false);
            logMessage("relayValue", "OFF", true);
        }
    }
}

function logMessageData(message) {
    const logEntry = `${message}\n`;
    try {
        appendFileSync(DATA_FILE_TMP, logEntry);
    } catch (err) {
        logError('Error writing to log file:', err);
    }
}
function logMessage(name, value, last) {
    const logEntry = `{"name": "${name}", "value": "${value}"}${last ? "" : ","}\n`;
    try {
        appendFileSync(DATA_FILE_TMP, logEntry);
    } catch (err) {
        logError('Error writing to log file:', err);
    }
}

function moveFile() {
    try {
        renameSync(DATA_FILE_TMP, DATA_FILE);
    } catch (err) {
        logError('Error moving log file:', err);
    }
}

async function run() {
    const formattedDate = new Date().toLocaleString('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(',', '');
    clearLogFile();
    logMessageData("{");
    logMessageData('"data": [');
    await main();
    logMessageData("],");
    logMessageData('"date": "' + formattedDate + '"}');
    moveFile();
}

run().catch(err => {
    logError("Error in main execution:", err);
});
