const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    console.log('Connected to database.');

    try {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS farmer_crops (
                id INT AUTO_INCREMENT PRIMARY KEY,
                farmer_id INT,
                crop_name VARCHAR(100),
                variety VARCHAR(100),
                season VARCHAR(100),
                field_plot VARCHAR(100),
                sowing_date DATE,
                harvest_date DATE,
                area DECIMAL(10, 2),
                area_unit VARCHAR(20) DEFAULT 'Acre',
                irrigation_type VARCHAR(100),
                notes TEXT,
                status ENUM('Upcoming', 'Growing', 'Completed') DEFAULT 'Growing',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        console.log('farmer_crops table created successfully.');

        console.log('farmer_crops table ready.');

    } catch (err) {
        console.error('Error during migration:', err);
    } finally {
        await connection.end();
    }
}

migrate();
