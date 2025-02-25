const axios = require('axios');
const { getProperty } = require('../properties/properties');

const TIBBER_API_URL = "https://api.tibber.com/v1-beta/gql";
const TIBBER_TOKEN = getProperty("TIBBER_TOKEN", true);
const TIBBER_HOME_ID = getProperty("TIBBER_HOME_ID", true);

const query = `{
    }`;

async function getElectricityPrice() {
    try {
        const response = await axios.post(TIBBER_API_URL,
            {
                query : `{
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
                }`
            },
            {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${TIBBER_TOKEN}`
            },
            timeout: 5000
        });
        if (!response?.data?.data?.viewer?.home?.currentSubscription?.priceInfo?.today) {
            logError("Error: Tibber response is missing expected fields.");
            return;
        }

        let prices = response.data.data.viewer.home.currentSubscription.priceInfo.today;
        return prices;
    } catch (error) {
        console.error("Failed to fetch electricity price:", error.message);
        return null;
    }
}

module.exports = { getElectricityPrice };
