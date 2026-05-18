const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const hash = await bcrypt.hash('password123', 10);

    console.log('Updating farmer password...');
    await conn.execute('UPDATE users SET password_hash = ? WHERE email = "manik23@gmail.com"', [hash]);

    console.log('Updating officer password...');
    await conn.execute('UPDATE agri_officers SET password_hash = ? WHERE email = "jannatul23@gmail.com"', [hash]);

    console.log('Updating researcher password...');
    await conn.execute('UPDATE researchers SET password_hash = ? WHERE email = "mehar23@gmail.com"', [hash]);

    console.log('All passwords successfully reset to: password123');
    await conn.end();
  } catch (err) {
    console.error(err);
  }
})();
