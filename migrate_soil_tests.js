const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateSoilTests() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        console.log('Migrating soil_tests table...');
        
        // Add new columns if they don't exist
        const columnsToAdd = [
            'ADD COLUMN IF NOT EXISTS location_details TEXT',
            'ADD COLUMN IF NOT EXISTS crop_type VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS problem_description TEXT',
            'ADD COLUMN IF NOT EXISTS image_url TEXT',
            'ADD COLUMN IF NOT EXISTS request_message TEXT',
            'ADD COLUMN IF NOT EXISTS deadline DATE'
        ];

        for (const col of columnsToAdd) {
            try {
                await connection.execute(`ALTER TABLE soil_tests ${col}`);
                console.log(`Executed: ${col}`);
            } catch (e) {
                console.log(`Column might already exist or error: ${e.message}`);
            }
        }

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Error migrating table:', err);
    } finally {
        await connection.end();
    }
}

migrateSoilTests();
