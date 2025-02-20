import fetch from "node-fetch";
import { appendFileSync } from 'fs';
import { writeFileSync } from 'fs';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHELLY_IP = "192.168.1.216";
const TIBBER_TOKEN = readSecret("TIBBER_TOKEN");
const TIBBER_HOME_ID = readSecret("TIBBER_HOME_ID");
const MAX_PRICE = 2; // Don't turn on if price is above 2 kr
const OPEN_WEATHER_API_KEY = readSecret("OPEN_WEATHER_API_KEY");
const LATITUDE = 55.61024170239335;
const LONGITUDE = 13.076425737606135;
const LOG_FILE = path.join(__dirname, 'data.json');

const query = `{
    viewer {
        home(id: "${TIBBER_HOME_ID}") {
            currentSubscription {
                priceInfo {
                    today {
                        total
                        startsAt
                    }
                }
            }
        }
    }
}`;

function readSecret(key) {
    const filePath = path.join(__dirname, 'secrets.txt');
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n');
    for (let line of lines) {
        const [k, v] = line.split('=');
        if (k === key) {
            return v;
        }
    }

}
function clearLogFile() {
    try {
        writeFileSync(LOG_FILE, '', 'utf8');
    } catch (err) {
        console.error('Error clearing log file:', err);
    }
}

function logMessage(message) {
    const logEntry = `${message}\n`;
    try {
        appendFileSync(LOG_FILE, logEntry);
    } catch (err) {
        console.error('Error writing to log file:', err);
    }
}

function getSeasonAndHours(month) {
    if (month >= 3 && month <= 5) return { season: "Spring", hours: 4 };
    if (month >= 6 && month <= 8) return { season: "Summer", hours: 6 };
    if (month >= 9 && month <= 11) return { season: "Fall", hours: 4 };
    return { season: "Winter", hours: 3 };
}

async function fetchTibberPricesAndGetSchedule(hours, willFreeze) {
    try {
        const response = await fetch("https://api.tibber.com/v1-beta/gql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${TIBBER_TOKEN}`
            },
            body: JSON.stringify({query})
        });

        const {data} = await response.json();

        if (!data?.viewer?.home?.currentSubscription?.priceInfo?.today) {
            console.error("Error: Tibber response is missing expected fields.");
            return;
        }

        let prices = data.viewer.home.currentSubscription.priceInfo.today;

        // Filter out hours where price > MAX_PRICE unless it's freezing
        let validHours = willFreeze ? prices.filter(p => p.total <= MAX_PRICE) : prices;
        if (validHours.length === 0) {
            logMessage("No valid hours found below the price limit.");
            return;
        }

        // Sort by price (cheapest first)
        validHours.sort((a, b) => a.total - b.total);

        // Split the day into 3 equal sections
        const hoursPerSection = hours / 3;

        const morning = validHours.filter(p => new Date(p.startsAt).getHours() < 8);
        const afternoon = validHours.filter(p => new Date(p.startsAt).getHours() >= 8 && new Date(p.startsAt).getHours() < 16);
        const evening = validHours.filter(p => new Date(p.startsAt).getHours() >= 16);

        function selectBestTimestamps(section, neededHours) {
            let selectedTimestamps = [];
            let remainingTime = neededHours;
            for (let hour of section) {
                let startTime = new Date(hour.startsAt).getTime();
                let duration = Math.min(remainingTime, 1) * 60 * 60 * 1000; // Convert to milliseconds
                selectedTimestamps.push({ action: "on", timestamp: startTime });
                selectedTimestamps.push({ action: "off", timestamp: startTime + duration });
                remainingTime -= Math.min(remainingTime, 1);
                if (remainingTime <= 0) break;
            }
            return selectedTimestamps;
        }

        let schedule = [
            ...selectBestTimestamps(morning, hoursPerSection),
            ...selectBestTimestamps(afternoon, hoursPerSection),
            ...selectBestTimestamps(evening, hoursPerSection)
        ];

        return schedule;

    } catch (error) {
        logMessage("Fetch error:" + error);
        console.error("Fetch error:", error);
    }
}

// Function to send HTTP request to Shelly device
async function controlShelly(action) {
    const url = `http://${SHELLY_IP}/relay/0?turn=${action}`;
    try {
        const response = await fetch(url);
        //console.log(`Shelly turned ${action}: ${response.status}`);
    } catch (error) {
        console.error(`Failed to turn ${action} Shelly:`, error);
        logMessage(`Failed to turn ${action} Shelly:` + error);
    }
}

// Function to schedule ON/OFF actions
function scheduleShellyActions(schedule) {
    const now = Date.now();

    schedule.forEach(event => {
        let delay = event.timestamp - now;
        if (delay > 0) {
            console.log(`Scheduling ${event.action} in ${delay / 1000} seconds`);
            setTimeout(() => {
                controlShelly(event.action);
            }, delay);
        }
    });
}

async function fetchHourlyWeather(lat, lon, apiKey) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    return fetch(url)
        .then(response => {
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error("Error fetching weather data:", error);
        });
}

function hasSubzeroTemperatures(weatherData) {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return weatherData.list.some((forecast) => {
        const forecastTime = new Date(forecast.dt * 1000);
        return forecastTime >= now && forecastTime <= endOfDay && forecast.main.temp < 0;
    });
}

async function willItFreezeToday(apiKey) {
    try {
        const weatherData = await fetchHourlyWeather(LATITUDE, LONGITUDE, apiKey);
        return hasSubzeroTemperatures(weatherData);
    } catch (error) {
        console.error("Error:", error);
        logMessage("Error:" + error);
        return false;
    }
}

const now = new Date();
let { season, hours } = getSeasonAndHours(now.getMonth() + 1);
const willFreeze = await willItFreezeToday(OPEN_WEATHER_API_KEY);
if (willFreeze) {
    hours = hours + 3;
}

//1. CREATE LOG FILE.
clearLogFile();
//2. APPEND CONFIG DATA FROM TOP.
logMessage("{");
logMessage('"properties": [');
logMessage('{ "name": "SHELLY_IP", "value": "' + SHELLY_IP  + '"},');
logMessage('{ "name": "TIBBER_TOKEN", "value": "' + TIBBER_TOKEN  + '"},');
logMessage('{ "name": "TIBBER_HOME_ID", "value": "' + TIBBER_HOME_ID  + '"},');
logMessage('{ "name": "MAX_PRICE (Don\'t turn on if price is above MAX_PRICE kr)", "value": "' + MAX_PRICE  + '"},');
logMessage('{ "name": "OPEN_WEATHER_API_KEY", "value": "' + OPEN_WEATHER_API_KEY  + '"}');
logMessage("],");
//3. PRINT WEATHER DATA
logMessage('"data": [');
logMessage('{ "name": "SEASON", "value": "' + season  + '"},');
logMessage('{ "name": "PUMP RUN TIME (h)", "value": "' + hours  + '"},');
logMessage('{ "name": "FREEZE TODAY?", "value": "' + willFreeze  + '"}');
logMessage("],");
//4. FETCH SCHEDULE
let schedule = await fetchTibberPricesAndGetSchedule(hours, willFreeze);

// Sort timestamps in order
schedule.sort((a, b) => a.timestamp - b.timestamp);

// Remove duplicate timestamps
const filteredTimestamps = schedule.reduce((acc, current, index, array) => {
    // Check if the current object has the same timestamp as the previous one
    if (index > 0 && array[index - 1].timestamp === current.timestamp) {
        // Skip adding both objects with the same timestamp
        // Remove the previous object (it's already in the acc)
        acc.pop();
        return acc; // Continue without adding the current one
    } else {
        // Add the current object if it's not part of a duplicate timestamp
        acc.push(current);
        return acc;
    }
}, []);

const formattedDate = now.toISOString().split('T')[0]; // 'YYYY-MM-DD'
logMessage('"date": "' + formattedDate + '",');
let scheduleText = "";
filteredTimestamps.forEach(event => {
    const date = new Date(event.timestamp);
    const hours = date.getHours();  // Get the hours
    const minutes = date.getMinutes();  // Get the minutes
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    scheduleText += `"${timeString} - ${event.action.toUpperCase()}",`;
});
if (scheduleText.endsWith(',')) {
    scheduleText = scheduleText.slice(0, -1);
}
logMessage('"content": [' + scheduleText + ']');
logMessage("}");

// Schedule the Shelly actions
scheduleShellyActions(filteredTimestamps);
