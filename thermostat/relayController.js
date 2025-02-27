const { logError, log } = require("../common/logger");
const rpio = require('rpio');

const RELAY_GPIO_PIN = 4;

rpio.init({ mapping: 'gpio' });
rpio.open(RELAY_GPIO_PIN, rpio.OUTPUT); // Open the pin without changing state

function relayController(state) {
    const currentState = rpio.read(RELAY_GPIO_PIN);
    let turnOn = state === true;
    if (turnOn && currentState === 0 || !turnOn && currentState === 1) {
        rpio.write(RELAY_GPIO_PIN, state ? rpio.LOW : rpio.HIGH);
        log("Relay switched" + (state ? "ON" : "OFF"));
    }
}

function isRelayOn() {
    return rpio.read(RELAY_GPIO_PIN) === rpio.LOW;
}

module.exports = { setRelay: relayController,
    isRelayOn };
