const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'krishibondhu'
  });

  const [rows] = await connection.execute('DESCRIBE farmer_crops');
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}

check();
