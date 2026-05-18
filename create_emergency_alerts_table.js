const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'krishibondhu',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function createTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS emergency_alerts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                officer_id INT NOT NULL,
                division VARCHAR(50) NOT NULL,
                type VARCHAR(30) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                severity VARCHAR(20) DEFAULT 'Warning',
                is_active TINYINT(1) DEFAULT 1,
                expires_at DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('emergency_alerts table created successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error creating table:', err);
        process.exit(1);
    }
}

createTable();
