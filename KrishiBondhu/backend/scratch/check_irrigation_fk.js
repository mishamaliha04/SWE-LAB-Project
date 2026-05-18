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

    console.log('\n--- CREATE TABLE STATEMENT FOR IRRIGATION ---');
    const [rows] = await conn.execute('SHOW CREATE TABLE irrigation');
    console.log(rows[0]['Create Table']);

    await conn.end();
  } catch (err) {
    console.error(err);
  }
})();
