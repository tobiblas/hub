const { getProperty } = require('../properties/properties');
const { writeFileSync, appendFileSync, renameSync } = require("fs");
const { logError, log } = require("../common/logger");
const path = require("path");
const axios = require('axios');
const { controlShelly } = require("../common/shellyController.js");
const logger = require("../common/logger");

const SHELLY_IP = getProperty("poolLightsIP");
const OPEN_WEATHER_API_KEY = getProperty("OPEN_WEATHER_API_KEY", true);
const MALMO_COORDS = { lat: 55.61024170239335, lon: 13.076425737606135 }; // Malmö, Sweden coordinates
const LOG_FILE = path.join(__dirname, 'data.json');

function clearDataFile() {
    try {
        writeFileSync(LOG_FILE, '', 'utf8');
    } catch (err) {
        logger.logError('Error clearing log file:', err);
    }
}

function logData(message) {
    const logEntry = `${message}\n`;
    try {
        appendFileSync(LOG_FILE, logEntry);
    } catch (err) {
        logger.logError('Error writing to log file:', err);
    }
}

// Function to get the sunset time from OpenWeatherAPI
async function getSunsetTime() {
    try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
            params: {
                lat: MALMO_COORDS.lat,
                lon: MALMO_COORDS.lon,
                exclude: 'current,minutely,hourly,alerts',
                appid: OPEN_WEATHER_API_KEY,
                units: 'metric'
            }
        });

        const sunsetUnix = response.data.city.sunset; // Sunset time in Unix timestamp
        const sunriseUnix = response.data.city.sunrise; // Sunrise time in Unix timestamp
        const sunsetDate = new Date(sunsetUnix * 1000); // Convert to JavaScript Date
        return sunsetDate;
    } catch (error) {
        logError(`Error fetching sunset time: ${error.message}`);
        throw error; // Propagate error
    }
}

let turnOffTimeout; // Global variable to store the timeout reference

// Function to parse the time string and create a Date object, considering the current time
function getPoolLightsOffTime(timeString) {
    const currentDate = new Date(); // Get today's date
    const [hours, minutes] = timeString.split(':'); // Split the time string into hours and minutes
    currentDate.setHours(hours, minutes, 0, 0); // Set the hours and minutes while keeping the current date
    // If the time is earlier than the current time, add one day to the date
    if (currentDate < new Date()) {
        currentDate.setDate(currentDate.getDate() + 1); // Add one day
    }
    return currentDate;
}

// Function to schedule the lights to turn off
function scheduleTurnOff(millisUntilTurnOffTime, poolLightsOffTimeString, maxReschedules = 1) {
    const now = Date.now();

    // If there's already a timeout scheduled, cancel it and log the action
    if (turnOffTimeout) {
        clearTimeout(turnOffTimeout);
        log('Previous turn-off scheduled action canceled.');
    }

    // Schedule the lights to turn off at the new time
    log("Lights will turn off in " + (millisUntilTurnOffTime - now) + "ms");
    turnOffTimeout = setTimeout(() => {
        // Re-check if the off time has changed at the time of execution
        const currentOffTimeString = getProperty("poolLightsOffTime");
        if (currentOffTimeString !== poolLightsOffTimeString && maxReschedules > 0) {
            const poolLightsOffTime = getPoolLightsOffTime(currentOffTimeString);
            const turnOffTime = poolLightsOffTime.getTime();

            log('Pool lights off time has changed. Rescheduling...');
            // If the time has changed, reschedule the turning off action with the new time
            scheduleTurnOff(turnOffTime, currentOffTimeString, maxReschedules - 1); // Reschedule with the new time
            return; // Exit the current timeout action
        }
        controlShelly("off", SHELLY_IP);
        log('Lights turned off');
    }, millisUntilTurnOffTime - now);

    log(`Scheduled lights to turn off at: ${poolLightsOffTimeString}`);
}

// Example of how to schedule lights based on sunset time and the poolLightsOffTime
async function scheduleLights() {
    try {
        const sunsetTime = await getSunsetTime();
        const poolLightsOffTimeString = getProperty("poolLightsOffTime"); // This will be something like "22:30"
        log(`Sunset time today is: ${sunsetTime}`);
        log(`Pool lights off time today is: ${poolLightsOffTimeString}`);

        const offset = 30 * 60 * 1000; // 30 minutes in milliseconds
        const turnOnTime = sunsetTime.getTime() + offset;

        const poolLightsOffTime = getPoolLightsOffTime(poolLightsOffTimeString);
        const turnOffTime = poolLightsOffTime.getTime();

        const onString = new Date(turnOnTime).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
        const offString = new Date(turnOffTime).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });

        clearDataFile();
        logData('{"data": [');
        logData('{ "name": "on", "value": '+ turnOnTime  + '},');
        logData('{ "name": "onString", "value": "' + onString  + '"},');
        logData('{ "name": "off", "value": '+ turnOffTime  + '},');
        logData('{ "name": "offString", "value": "' + offString  + '"}');
        logData("],");

        const formattedDate = new Date().toLocaleString('sv-SE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', '');
        logData('"date": "' + formattedDate + '"}');

        log("Lights will turn on in " + (turnOnTime - Date.now()) + "ms");
        setTimeout(() => {
            controlShelly("on", SHELLY_IP);
            log('Lights turned on');
        }, turnOnTime - Date.now());

        // Schedule the lights to turn off at the specified poolLightsOffTime
        scheduleTurnOff(turnOffTime, poolLightsOffTimeString);
    } catch (error) {
        logError('Error scheduling lights: ' + error.message);
    }
}

// Schedule the script to run once per day (with crontab)
scheduleLights();
