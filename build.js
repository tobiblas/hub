const fs = require('fs');
const path = require('path');

const version = Date.now();
const publicDir = 'public';

// Function to replace VERSION_PLACEHOLDER in files
function updateVersionInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('VERSION_PLACEHOLDER')) {
        content = content.replace(/VERSION_PLACEHOLDER/g, version);
        fs.writeFileSync(filePath, content);
        console.log(`Updated version in: ${filePath}`);
    }
}

// Scan the `public` directory for .html, .css, and .js files
fs.readdirSync(publicDir).forEach(file => {
    const filePath = path.join(publicDir, file);
    if (file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.js')) {
        updateVersionInFile(filePath);
    }
});

console.log('Versioning completed:', version);

