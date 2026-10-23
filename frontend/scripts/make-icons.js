const fs = require('fs');
const path = require('path');

// Simple 1x1 green PNG base64 fallback for browsers requiring png in manifest
const png192Base64 = "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAIAAAAbLs18AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAYElEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7waKRAAB6wT88wAAAABJRU5ErkJggg==";

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), Buffer.from(png192Base64, 'base64'));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), Buffer.from(png192Base64, 'base64'));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), Buffer.from(png192Base64, 'base64'));
console.log("PWA PNG icons generated successfully");
