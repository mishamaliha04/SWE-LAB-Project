const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        const [rows] = await connection.execute('DESCRIBE diseases');
        console.log(rows);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

check();
