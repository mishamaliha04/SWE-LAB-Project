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

    console.log('Altering column image_url in table diseases to LONGTEXT...');
    await conn.execute('ALTER TABLE diseases MODIFY COLUMN image_url LONGTEXT');
    console.log('Column successfully modified to LONGTEXT!');

    console.log('\n--- VERIFY CREATE TABLE STATEMENT ---');
    const [rows] = await conn.execute('SHOW CREATE TABLE diseases');
    console.log(rows[0]['Create Table']);

    await conn.end();
  } catch (err) {
    console.error('Error altering column:', err);
  }
})();
