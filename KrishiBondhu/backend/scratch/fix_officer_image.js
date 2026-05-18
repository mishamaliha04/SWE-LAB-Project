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

    console.log('Altering column profile_image in table agri_officers to LONGTEXT...');
    await conn.execute('ALTER TABLE agri_officers MODIFY COLUMN profile_image LONGTEXT');
    console.log('Column successfully modified to LONGTEXT!');

    await conn.end();
  } catch (err) {
    console.error('Error altering column:', err);
  }
})();
