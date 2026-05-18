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

    console.log('Fetching all users...');
    const [rows] = await conn.execute('SELECT id, fullname, email, role FROM users');
    console.log(rows);

    await conn.end();
  } catch (err) {
    console.error(err);
  }
})();
