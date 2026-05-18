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

    // Set passwords of all three users to exactly 'password' (8 characters)
    const hash = await bcrypt.hash('password', 10);

    console.log('Resetting farmer password to "password"...');
    await conn.execute('UPDATE users SET password_hash = ? WHERE email = "manik23@gmail.com"', [hash]);

    console.log('Resetting officer password to "password"...');
    await conn.execute('UPDATE agri_officers SET password_hash = ? WHERE email = "jannatul23@gmail.com"', [hash]);

    console.log('Resetting researcher password to "password"...');
    await conn.execute('UPDATE researchers SET password_hash = ? WHERE email = "mehar23@gmail.com"', [hash]);

    console.log('Successfully updated all passwords to: password');
    await conn.end();
  } catch (err) {
    console.error(err);
  }
})();
