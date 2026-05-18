const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        console.log('Changing image_url column type to LONGTEXT...');
        await connection.execute('ALTER TABLE diseases MODIFY COLUMN image_url LONGTEXT');
        console.log('Column modified successfully!');
    } catch (err) {
        console.error('Failed to modify column:', err);
    } finally {
        await connection.end();
    }
}

fix();
