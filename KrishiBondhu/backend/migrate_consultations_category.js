const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateConsultationsCategory() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        console.log('Adding category column to consultations table...');
        await connection.execute('ALTER TABLE consultations ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT "Others" AFTER message');
        console.log('Migration successful.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrateConsultationsCategory();
