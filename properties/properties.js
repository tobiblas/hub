const path = require('path');
const fs = require('fs');

function getProperty(key, secret) {
    const filePath = secret ? path.join(__dirname, 'secrets.txt') : path.join(__dirname, 'config.txt');
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData[key];
}

module.exports = { getProperty };