const fs = require('fs');

const findTag = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  console.log(`\n--- SEARCHING IN ${filePath} ---`);
  lines.forEach((line, idx) => {
    if (line.includes('<Profile') || line.includes('role')) {
      if (line.includes('<Profile')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
        // print next 5 lines
        for (let i = 1; i <= 5; i++) {
          console.log(`  +${i}: ${lines[idx + i].trim()}`);
        }
      }
    }
  });
};

findTag('e:/KrishiBondhu/auth-frontend/src/pages/AgriOfficerDashboard.jsx');
findTag('e:/KrishiBondhu/auth-frontend/src/pages/FarmerDashboard.jsx');
