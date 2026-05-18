const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    console.log('Connected to database.');

    try {
        // Drop existing foreign keys
        console.log('Dropping old foreign keys...');
        try { await connection.execute('ALTER TABLE irrigation DROP FOREIGN KEY irrigation_ibfk_2'); } catch(e) { console.log('irrigation_ibfk_2 not found'); }
        try { await connection.execute('ALTER TABLE diseases DROP FOREIGN KEY diseases_ibfk_2'); } catch(e) { console.log('diseases_ibfk_2 not found'); }
        try { await connection.execute('ALTER TABLE fertilizer_logs DROP FOREIGN KEY fertilizer_logs_ibfk_2'); } catch(e) { console.log('fertilizer_logs_ibfk_2 not found'); }

        // Add new foreign keys pointing to farmer_crops
        console.log('Adding new foreign keys pointing to farmer_crops...');
        await connection.execute('ALTER TABLE irrigation ADD CONSTRAINT fk_irrigation_crop FOREIGN KEY (crop_id) REFERENCES farmer_crops(id) ON DELETE CASCADE');
        await connection.execute('ALTER TABLE diseases ADD CONSTRAINT fk_diseases_crop FOREIGN KEY (crop_id) REFERENCES farmer_crops(id) ON DELETE CASCADE');
        await connection.execute('ALTER TABLE fertilizer_logs ADD CONSTRAINT fk_fertilizer_crop FOREIGN KEY (crop_id) REFERENCES farmer_crops(id) ON DELETE CASCADE');

        console.log('Schema fixed successfully.');
    } catch (err) {
        console.error('Error fixing schema:', err);
    } finally {
        await connection.end();
    }
}

fixSchema();
