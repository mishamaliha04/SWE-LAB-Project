const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkData() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const [farmers] = await connection.execute('SELECT * FROM farmers');
    console.log(`\nData in farmers table (${farmers.length} rows):`);
    console.table(farmers.map(f => ({ id: f.id, name: f.fullname, email: f.email, role: f.role })));

    const [users] = await connection.execute('SELECT * FROM users');
    console.log(`\nData in users table (${users.length} rows):`);
    console.table(users.map(u => ({ id: u.id, name: u.fullname, email: u.email, role: u.role })));

    await connection.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkData();
