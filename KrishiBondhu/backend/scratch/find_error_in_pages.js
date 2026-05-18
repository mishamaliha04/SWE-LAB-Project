const fs = require('fs');
const path = require('path');

const pagesDir = 'e:/KrishiBondhu/auth-frontend/src/pages';
const files = fs.readdirSync(pagesDir);

console.log('--- SEARCHING FOR "failed to update" IN ALL PAGES ---');

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (fs.statSync(filePath).isFile()) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes('failed to update')) {
        console.log(`[${file}] Line ${idx + 1}: ${line.trim()}`);
      }
    });
  }
});
