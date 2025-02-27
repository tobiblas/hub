

function log(message) {
    console.log(new Date() + ": " + message);
}

function logError(message, err) {
    console.error(new Date() + ": " + message, err);
}

module.exports = { log, logError };