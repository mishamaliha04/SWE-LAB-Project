const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'routes', 'farmer.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('--- Disease Routes in farmer.js ---');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('diseases') && (line.includes('router.') || line.includes('app.'))) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
