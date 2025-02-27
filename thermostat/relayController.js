const rpio = require('rpio');

const RELAY_GPIO_PIN = 4;

rpio.init({ mapping: 'gpio' });
rpio.open(RELAY_GPIO_PIN, rpio.OUTPUT); // Open the pin without changing state

function relayController(state) {
    const currentState = rpio.read(RELAY_GPIO_PIN);
    if (state !== currentState) {
        rpio.write(RELAY_GPIO_PIN, state ? rpio.LOW : rpio.HIGH);
        console.log("Relay switched", state ? "ON" : "OFF");
    } else {
        console.log("Relay state unchanged.");
    }
}

function isRelayOn() {
    return rpio.read(RELAY_GPIO_PIN) === rpio.LOW;
}

module.exports = { setRelay: relayController,
    isRelayOn };
