

function log(message) {
    const formattedDate = new Date().toLocaleString('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(',', '');
    console.log(formattedDate + ": " + message);
}

function logError(message, err) {
    const formattedDate = new Date().toLocaleString('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(',', '');
    console.error(formattedDate + ": " + message, err);
}

module.exports = { log, logError };