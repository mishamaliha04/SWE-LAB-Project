const mysql = require('mysql2/promise');
require('dotenv').config();

async function createFieldVisitsTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        console.log('Creating field_visits table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS field_visits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                farmer_id INT,
                officer_id INT NOT NULL,
                farmer_name VARCHAR(100) NOT NULL,
                location VARCHAR(255) NOT NULL,
                purpose VARCHAR(255) NOT NULL,
                visit_date DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'Upcoming',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (officer_id) REFERENCES agri_officers(id) ON DELETE CASCADE
            )
        `);
        console.log('Table created successfully.');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        await connection.end();
    }
}

createFieldVisitsTable();
