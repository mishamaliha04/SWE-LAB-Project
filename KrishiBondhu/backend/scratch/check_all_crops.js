const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAll() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        const [rows] = await connection.execute('SELECT farmer_id, COUNT(*) as count FROM farmer_crops GROUP BY farmer_id');
        console.log('Farmer crops distribution:', rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

checkAll();
