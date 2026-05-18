const mysql = require('mysql2/promise');
require('dotenv').config();

async function testUndefined() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        console.log('Testing insert with undefined...');
        const [result] = await connection.execute(
            'INSERT INTO farmer_crops (farmer_id, crop_name, notes) VALUES (?, ?, ?)',
            [1, 'Test Undefined', undefined]
        );
        console.log('Insert success!', result.insertId);
    } catch (err) {
        console.error('Insert failed with error:', err.message);
    } finally {
        await connection.end();
    }
}

testUndefined();
