const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('=== OFFICER ===');
  const [o] = await conn.execute('SELECT id, fullname, division FROM agri_officers');
  console.log(o);

  console.log('\n=== FARMERS IN RANGPUR ===');
  const [f] = await conn.execute("SELECT id, fullname, division FROM users WHERE division = 'Rangpur' AND role = 'farmer'");
  console.log(f);

  console.log('\n=== DISEASE REQUESTS (request_suggestion=1) ===');
  const [d] = await conn.execute('SELECT d.id, d.farmer_id, d.severity, d.request_suggestion, u.fullname FROM diseases d JOIN users u ON d.farmer_id = u.id');
  console.log(d);

  console.log('\n=== SOIL TESTS ===');
  const [s] = await conn.execute('SELECT id, farmer_id, status, officer_id FROM soil_tests');
  console.log(s);

  console.log('\n=== FIELD VISITS ===');
  const [v] = await conn.execute('SELECT id, officer_id, farmer_name, status, visit_date FROM field_visits');
  console.log(v);

  console.log('\n=== CONSULTATIONS ===');
  const [c] = await conn.execute('SELECT id, farmer_id, subject, status FROM consultations');
  console.log(c);

  // Test the actual API query for stats
  console.log('\n=== STATS QUERY (same as API) ===');
  const [farmerCount] = await conn.execute("SELECT COUNT(*) as count FROM users WHERE division = 'Rangpur' AND role = 'farmer'");
  console.log('Total farmers:', farmerCount[0].count);

  const [cropDist] = await conn.execute(`
    SELECT fc.crop_name as name, COUNT(*) as value 
    FROM farmer_crops fc 
    JOIN users u ON fc.farmer_id = u.id 
    WHERE u.division = 'Rangpur' 
    GROUP BY fc.crop_name
  `);
  console.log('Crop distribution:', cropDist);

  // Test disease requests query (same as officer dashboard)
  console.log('\n=== DISEASE REQUESTS QUERY (same as API) ===');
  const [diseaseReqs] = await conn.execute(`
    SELECT d.*, u.fullname as farmer_name, u.profile_image as farmer_image, c.crop_name 
    FROM diseases d 
    JOIN users u ON d.farmer_id = u.id 
    JOIN farmer_crops c ON d.crop_id = c.id 
    WHERE u.division = 'Rangpur' AND d.request_suggestion = 1 
    ORDER BY d.logged_at DESC
  `);
  console.log('Disease requests for Rangpur:', diseaseReqs.length, 'records');
  diseaseReqs.forEach(r => console.log(`  ${r.farmer_name}: ${r.severity} - ${r.crop_name}`));

  await conn.end();
})();
