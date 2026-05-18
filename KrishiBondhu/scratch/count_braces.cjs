
const fs = require('fs');
const content = fs.readFileSync('e:/KrishiBondhu/auth-frontend/src/pages/FarmerDashboard.jsx', 'utf8');
console.log(`Open: ${content.split('{').length - 1}`);
console.log(`Close: ${content.split('}').length - 1}`);
console.log(`Open Parentheses: ${content.split('(').length - 1}`);
console.log(`Close Parentheses: ${content.split(')').length - 1}`);
console.log(`Open Brackets: ${content.split('[').length - 1}`);
console.log(`Close Brackets: ${content.split(']').length - 1}`);
