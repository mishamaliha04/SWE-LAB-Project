const mysql = require('mysql2/promise');
require('dotenv').config();

async function createResearchersTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        console.log('Dropping existing researchers table if it exists...');
        await connection.execute('DROP TABLE IF EXISTS researchers');

        console.log('Creating researchers table with correct standalone schema...');
        await connection.execute(`
            CREATE TABLE researchers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fullname VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                division VARCHAR(50) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                institution VARCHAR(255),
                specialization VARCHAR(100),
                research_area VARCHAR(255),
                profile_image LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Researchers table created successfully.');
    } catch (err) {
        console.error('Error creating researchers table:', err);
    } finally {
        await connection.end();
    }
}

createResearchersTable();
