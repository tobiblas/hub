

function log(message) {
    console.log(new Date().toISOString() + ": " + message);
}

function logError(message, err) {
    console.error(new Date().toISOString() + ": " + message, err);
}

module.exports = { log, logError };