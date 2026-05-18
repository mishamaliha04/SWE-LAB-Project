const mysql = require('mysql2/promise');
require('dotenv').config();

async function testInsert() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        console.log('Testing insert...');
        const [result] = await connection.execute(
            `INSERT INTO farmer_crops 
            (farmer_id, crop_name, variety, season, field_plot, sowing_date, harvest_date, area, area_unit, irrigation_type, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [1, 'Test Crop', 'Test Variety', 'Rabi', 'Test Plot', '2026-05-12', '2026-08-12', 1.5, 'Acre', 'Irrigated', 'Test Notes']
        );
        console.log('Insert success! ID:', result.insertId);
    } catch (err) {
        console.error('Insert failed:', err);
    } finally {
        await connection.end();
    }
}

testInsert();
