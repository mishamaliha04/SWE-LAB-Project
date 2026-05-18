const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    console.log('Connected to database.');

    try {
        console.log('Creating crop_master table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS crop_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name_bn VARCHAR(100) NOT NULL,
                name_en VARCHAR(100) NOT NULL,
                variety VARCHAR(100),
                image_url VARCHAR(255),
                season VARCHAR(100),
                duration VARCHAR(50),
                yield VARCHAR(50),
                water_requirement VARCHAR(50),
                market_demand VARCHAR(50),
                estimated_profit VARCHAR(100),
                suitability_tag VARCHAR(50)
            )
        `);

        console.log('Creating recommendation_mappings table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS recommendation_mappings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                soil_type VARCHAR(50),
                season VARCHAR(50),
                goal VARCHAR(50),
                crop1_id INT,
                crop2_id INT,
                crop3_id INT,
                FOREIGN KEY (crop1_id) REFERENCES crop_master(id),
                FOREIGN KEY (crop2_id) REFERENCES crop_master(id),
                FOREIGN KEY (crop3_id) REFERENCES crop_master(id)
            )
        `);

        console.log('Schema updated successfully.');
    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        await connection.end();
    }
}

updateSchema();
