const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSoilTestsTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        console.log('Adding missing columns to soil_tests table...');
        
        const columnsToAdd = [
            'ADD COLUMN IF NOT EXISTS location_details TEXT',
            'ADD COLUMN IF NOT EXISTS land_type VARCHAR(50)',
            'ADD COLUMN IF NOT EXISTS soil_texture VARCHAR(50)',
            'ADD COLUMN IF NOT EXISTS irrigation_source VARCHAR(50)',
            'ADD COLUMN IF NOT EXISTS current_crop VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS crop_type VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS fertilizer_history TEXT',
            'ADD COLUMN IF NOT EXISTS problem_description TEXT',
            'ADD COLUMN IF NOT EXISTS image_url LONGTEXT',
            'ADD COLUMN IF NOT EXISTS request_message TEXT',
            'ADD COLUMN IF NOT EXISTS deadline VARCHAR(50)'
        ];

        for (const col of columnsToAdd) {
            try {
                // MariaDB/MySQL doesn't support ADD COLUMN IF NOT EXISTS in all versions
                // We'll try to add it and ignore the "Duplicate column name" error (1060)
                await connection.execute(`ALTER TABLE soil_tests ${col}`);
                console.log(`Successfully added: ${col.split(' ').pop()}`);
            } catch (err) {
                if (err.errno === 1060) {
                    console.log(`Column ${col.split(' ').pop()} already exists.`);
                } else {
                    console.error(`Error adding column ${col}:`, err.message);
                }
            }
        }
        
        console.log('Table schema update complete.');
    } catch (err) {
        console.error('Database connection error:', err);
    } finally {
        await connection.end();
    }
}

updateSoilTestsTable();
