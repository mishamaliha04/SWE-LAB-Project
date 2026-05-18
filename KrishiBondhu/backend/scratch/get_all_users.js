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

    console.log('--- FARMERS (users table) ---');
    const [users] = await conn.execute('SELECT id, fullname, email, division, role FROM users');
    console.table(users);

    console.log('\n--- AGRICULTURAL OFFICERS ---');
    const [officers] = await conn.execute('SELECT id, fullname, email, division FROM agri_officers');
    console.table(officers);

    console.log('\n--- RESEARCHERS ---');
    const [researchers] = await conn.execute('SELECT id, fullname, email, division FROM researchers');
    console.table(researchers);

    await conn.end();
  } catch (err) {
    console.error(err);
  }
})();
