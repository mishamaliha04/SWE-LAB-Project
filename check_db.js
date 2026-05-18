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

    console.log('--- SEARCHING BY DESIGNATION ---');
    const [found] = await conn.execute('SELECT id, fullname, designation, email FROM agri_officers WHERE designation = "Senior Agricultural Officer"');
    console.log(found);

    await conn.end();
  } catch (err) {
    console.error(err);
  }
})();
