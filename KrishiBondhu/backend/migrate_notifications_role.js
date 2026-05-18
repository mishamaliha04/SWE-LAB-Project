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
        console.log('Updating notifications table...');
        
        // Remove foreign key constraint if it exists
        try {
            // First find the constraint name
            const [rows] = await connection.execute(`
                SELECT CONSTRAINT_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_NAME = 'notifications' 
                AND COLUMN_NAME = 'user_id' 
                AND REFERENCED_TABLE_NAME = 'users'
            `);
            
            if (rows.length > 0) {
                const constraintName = rows[0].CONSTRAINT_NAME;
                console.log(`Dropping foreign key constraint: ${constraintName}`);
                await connection.execute(`ALTER TABLE notifications DROP FOREIGN KEY ${constraintName}`);
            }
        } catch (err) {
            console.log('Error dropping foreign key (might not exist):', err.message);
        }

        // Add user_role column
        console.log('Adding user_role column...');
        await connection.execute('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_role VARCHAR(20) DEFAULT "farmer" AFTER user_id');

        console.log('Notifications table updated successfully!');
    } catch (err) {
        console.error('Error updating table:', err);
    } finally {
        await connection.end();
    }
}

updateNotificationsTable();
