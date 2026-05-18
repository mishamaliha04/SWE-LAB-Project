const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkFksIrrigation() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        const [rows] = await connection.execute(`
            SELECT 
                COLUMN_NAME, 
                CONSTRAINT_NAME, 
                REFERENCED_TABLE_NAME, 
                REFERENCED_COLUMN_NAME 
            FROM 
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE 
                TABLE_NAME = 'irrigation' 
                AND TABLE_SCHEMA = 'krishibondhu'
                AND REFERENCED_TABLE_NAME IS NOT NULL;
        `);
        console.log('Foreign Keys for irrigation:');
        console.table(rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

checkFksIrrigation();
