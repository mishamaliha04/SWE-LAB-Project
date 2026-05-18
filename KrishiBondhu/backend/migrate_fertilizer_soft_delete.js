const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'krishibondhu'
    });

    try {
        console.log('Adding is_deleted column to fertilizer_logs...');
        await connection.execute("ALTER TABLE fertilizer_logs ADD COLUMN is_deleted TINYINT(1) DEFAULT 0");
        console.log('Migration successful!');
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Column is_deleted already exists.');
        } else {
            console.error('Migration failed:', err);
        }
    } finally {
        await connection.end();
    }
}

migrate();
