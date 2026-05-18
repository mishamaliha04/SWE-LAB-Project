const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('\n--- FARMERS ---');
    const [farmers] = await conn.execute('SELECT id, fullname, email, division FROM users WHERE role = "farmer"');
    console.table(farmers);

    console.log('\n--- CROPS IN FARMER_CROPS ---');
    const [crops] = await conn.execute('SELECT id, farmer_id, crop_name, sowing_date, harvest_date, current_stage, area FROM farmer_crops');
    console.table(crops);

    await conn.end();
  } catch (err) {
    console.error(err);
  }
})();
