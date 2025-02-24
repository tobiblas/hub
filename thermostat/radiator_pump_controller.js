const rpio = require('rpio');

rpio.init({ mapping: 'gpio' }); // Use BCM numbering

const RELAY_GPIO_PIN = 4;

// Open the pin without changing its state
rpio.open(RELAY_GPIO_PIN, rpio.OUTPUT);

// Read the current state
const currentState = rpio.read(RELAY_GPIO_PIN);

console.log("Current relay state:", currentState ? "OFF" : "ON");

// Function to update relay state only if needed
function setRelay(state) {
    if (state !== currentState) {
        rpio.write(RELAY_GPIO_PIN, state ? rpio.LOW : rpio.HIGH);
        console.log("Relay switched", state ? "ON" : "OFF");
    } else {
        console.log("Relay state unchanged.");
    }
}

setRelay(true); // Turn the relay ON
// Example: Call setRelay(true) or setRelay(false) based on conditions


// temp_home:/root
// devices:Kitchen
// deviceIPs:192.168.1.232
// outdoorLocation:Malmö, Sweden
// openweatherApiKey:7caed7a426f57f9e269ad270296e97dc
// targetTemp:21.7
// threshold:0.25
// graceTimeMinutes:1
// unit:celsius
// expensiveBreakpoint:-1.0
// mediumExpensiveBreakpoint:-0.5

