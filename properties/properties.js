const path = require('path');
const fs = require('fs');

function getProperty(key, secret) {
    const filePath = secret ? path.join(__dirname, 'secrets.txt') : path.join(__dirname, 'config.txt');
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n');
    for (let line of lines) {
        const [k, v] = line.split('=');
        if (k === key) {
            return v;
        }
    }
}

module.exports = { getProperty };