const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateNotificationsTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        console.log('Adding action_url column...');
        await connection.execute('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url VARCHAR(255) DEFAULT NULL AFTER is_read');
        console.log('Notifications table updated successfully!');
    } catch (err) {
        console.error('Error updating table:', err);
    } finally {
        await connection.end();
    }
}

updateNotificationsTable();
