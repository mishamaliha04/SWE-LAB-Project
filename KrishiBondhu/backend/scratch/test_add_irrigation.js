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

    console.log('Inserting mock irrigation schedule...');
    // Sowing date is May 18, 2026. Sowing dates of Manik's crops:
    // crop_id 3 (Boro Rice), crop_id 4 (Maize), crop_id 5 (Potato)
    // Let's insert for Boro Rice (crop_id 3)
    const [result] = await conn.execute(
      'INSERT INTO irrigation (farmer_id, crop_id, schedule, quantity_liters, status) VALUES (?, ?, ?, ?, ?)',
      [2, 3, '2026-05-19 08:00:00', 120, 'pending']
    );

    console.log('Successfully inserted schedule! Insert ID:', result.insertId);

    // Let's select it back
    const [rows] = await conn.execute('SELECT * FROM irrigation WHERE id = ?', [result.insertId]);
    console.log('Retrieved record:', rows[0]);

    // Cleanup the test record
    await conn.execute('DELETE FROM irrigation WHERE id = ?', [result.insertId]);
    console.log('Cleanup completed.');

    await conn.end();
  } catch (err) {
    console.error('Error inserting irrigation schedule:', err);
  }
})();
