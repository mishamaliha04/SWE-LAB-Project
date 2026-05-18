const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDb() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Adding role column to farmers table...');
    await connection.execute('ALTER TABLE farmers ADD COLUMN role VARCHAR(20) DEFAULT "farmer" AFTER password_hash');
    console.log('Success!');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Role column already exists.');
    } else {
      console.error('Error fixing database:', err);
    }
  } finally {
    await connection.end();
  }
}

fixDb();
