const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearCrops() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        await connection.execute('DELETE FROM farmer_crops');
        console.log('All crops cleared from farmer_crops table.');
    } catch (err) {
        console.error('Error clearing crops:', err);
    } finally {
        await connection.end();
    }
}

clearCrops();
