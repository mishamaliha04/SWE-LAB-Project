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

    console.log('Inserting mock disease log with a large base64 image...');
    // Create a 1000-character mock base64 image string to exceed the old 255 VARCHAR limit
    const mockBase64Image = 'data:image/png;base64,' + 'A'.repeat(1000);

    const [result] = await conn.execute(
      'INSERT INTO diseases (farmer_id, crop_id, severity, description, image_url, action_taken) VALUES (?, ?, ?, ?, ?, ?)',
      [2, 3, 'Moderate', 'Test crop leaf showing spots.', mockBase64Image, 'Applied mock bio-fungicide']
    );

    console.log('Successfully logged disease! Insert ID:', result.insertId);

    // Retrieve and verify length
    const [rows] = await conn.execute('SELECT image_url FROM diseases WHERE id = ?', [result.insertId]);
    console.log('Retrieved image URL length:', rows[0].image_url.length, 'characters');

    // Cleanup
    await conn.execute('DELETE FROM diseases WHERE id = ?', [result.insertId]);
    console.log('Cleanup completed.');

    await conn.end();
  } catch (err) {
    console.error('Error logging disease issue:', err);
  }
})();
