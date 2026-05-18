const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'krishibondhu'
  });

  try {
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('Tables:', rows.map(r => Object.values(r)[0]));
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
})();
