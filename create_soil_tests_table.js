const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSoilTestsTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        console.log('Creating soil_tests table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS soil_tests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                farmer_id INT NOT NULL,
                test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'pending',
                
                -- Survey data from farmer
                location_details TEXT,
                land_type VARCHAR(50),
                soil_texture VARCHAR(50),
                irrigation_source VARCHAR(50),
                current_crop VARCHAR(100),
                crop_type VARCHAR(100),
                fertilizer_history TEXT,
                problem_description TEXT,
                image_url LONGTEXT,
                
                -- Request info from officer
                request_message TEXT,
                deadline VARCHAR(50),

                -- Analysis data from officer
                soil_type VARCHAR(50),
                ph_level DECIMAL(4,2),
                sand_pct INT,
                silt_pct INT,
                clay_pct INT,
                organic_matter DECIMAL(4,2),
                nitrogen_level VARCHAR(20),
                phosphorus_level VARCHAR(20),
                potassium_level VARCHAR(20),
                recommendations TEXT,
                officer_id INT,
                FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (officer_id) REFERENCES agri_officers(id) ON DELETE SET NULL
            )
        `);
        console.log('Table created successfully.');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        await connection.end();
    }
}

createSoilTestsTable();
