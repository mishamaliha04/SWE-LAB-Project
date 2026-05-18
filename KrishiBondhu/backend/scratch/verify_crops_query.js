const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [rows] = await conn.execute(
    `SELECT *, id AS crop_id, crop_name AS name, area AS area_acres,
     current_stage AS stage, COALESCE(status, 'Growing') AS status, 100 AS health_score
     FROM farmer_crops WHERE farmer_id = ? ORDER BY created_at DESC`,
    [2]
  );

  rows.forEach(r => console.log({
    id: r.id, crop_name: r.crop_name,
    status: r.status, stage: r.stage, area_acres: r.area_acres
  }));

  await conn.end();
})();
