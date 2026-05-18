const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'krishibondhu'
  });

  console.log('Adding current_stage column to farmer_crops...');
  try {
    await connection.execute(`
      ALTER TABLE farmer_crops 
      ADD COLUMN current_stage VARCHAR(50) DEFAULT 'Seedling'
    `);
    console.log('Success!');
  } catch (err) {
    console.log('Column might already exist or error:', err.message);
  }

  await connection.end();
}

migrate();
