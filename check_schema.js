const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        console.log('Checking soil_tests table schema...');
        const [rows] = await connection.execute('DESCRIBE soil_tests');
        console.table(rows);
    } catch (err) {
        console.error('Error describing table:', err);
    } finally {
        await connection.end();
    }
}

checkSchema();
