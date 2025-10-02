const fs = require('fs');
const path = require('path');

// Create www directory if it doesn't exist
const wwwDir = path.join(__dirname, '..', 'www');
if (!fs.existsSync(wwwDir)) {
    fs.mkdirSync(wwwDir, { recursive: true });
}

// Copy index.html
const indexSrc = path.join(__dirname, '..', 'index.html');
const indexDest = path.join(wwwDir, 'index.html');
fs.copyFileSync(indexSrc, indexDest);
console.log('Copied index.html to www/');

// Copy src directory
const srcDir = path.join(__dirname, '..', 'src');
const srcDest = path.join(wwwDir, 'src');

// Remove old src directory if it exists
if (fs.existsSync(srcDest)) {
    fs.rmSync(srcDest, { recursive: true, force: true });
}

// Copy src directory recursively
function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

copyRecursive(srcDir, srcDest);
console.log('Copied src/ to www/src/');
console.log('Web assets ready for Capacitor sync...');

// Note: After running 'npx cap sync', manually set landscape orientation in:
// android/app/src/main/AndroidManifest.xml
// Add: android:screenOrientation="landscape" to the <activity> tag
