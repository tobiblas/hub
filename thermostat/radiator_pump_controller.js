const Gpio = require('onoff').Gpio;

const RELAY_ON = 1;
const RELAY_OFF = -1;
const RELAY_GPIO_PIN = 4;

const relay = new Gpio(RELAY_GPIO_PIN, 'out');

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

function logStatus(fromVal, toVal, targetTemp, threshold) {
    console.log(`Relay changed from ${fromVal} to ${toVal}`);
    console.log(`Target Temp: ${targetTemp}, Threshold: ${threshold}`);
}

function setRelay(fromVal, toVal, targetTemp, threshold) {
    logStatus(fromVal, toVal, targetTemp, threshold);
    relay.writeSync(toVal === RELAY_ON ? 0 : 1);
}

// Example usage
setRelay(-1, RELAY_ON, 22, 25, 2);

// Cleanup on exit
// process.on('SIGINT', () => {
//     relay.unexport();
//     console.log("GPIO cleanup done");
//     process.exit();
// });
