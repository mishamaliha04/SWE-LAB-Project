const fs = require('fs');
const path = require('path');

const filePath = 'e:/KrishiBondhu/auth-frontend/src/pages/ResearcherDashboard.jsx';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log('--- SEARCHING FOR "profile" OR "failed" IN ResearcherDashboard.jsx ---');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('profile') || line.toLowerCase().includes('failed') || line.toLowerCase().includes('save')) {
    if (idx < 500 || idx > 1500) { // filter or show some ranges
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
