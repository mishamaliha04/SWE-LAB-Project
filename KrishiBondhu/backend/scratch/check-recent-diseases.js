const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRecentDiseases() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        const [rows] = await connection.execute('SELECT * FROM diseases ORDER BY logged_at DESC LIMIT 5');
        console.log('Recent disease logs:');
        console.table(rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

checkRecentDiseases();
