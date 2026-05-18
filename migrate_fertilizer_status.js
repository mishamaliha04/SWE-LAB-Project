const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'krishibondhu'
    });

    try {
        console.log('Adding status column to fertilizer_logs...');
        await connection.execute("ALTER TABLE fertilizer_logs ADD COLUMN status ENUM('pending', 'completed') DEFAULT 'completed'");
        console.log('Migration successful!');
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Column status already exists.');
        } else {
            console.error('Migration failed:', err);
        }
    } finally {
        await connection.end();
    }
}

migrate();
