const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDb() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Tables:', tables);

        for (const table of tables) {
            const tableName = Object.values(table)[0];
            const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
            console.log(`\nColumns for ${tableName}:`);
            console.table(columns);
        }
        
        const [diseasesColumns] = await connection.execute('DESCRIBE diseases');
        console.log('\nDiseases table structure:');
        console.table(diseasesColumns);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

checkDb();
