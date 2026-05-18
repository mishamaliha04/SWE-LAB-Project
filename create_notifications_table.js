const mysql = require('mysql2/promise');
require('dotenv').config();

async function createNotificationsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Creating notifications table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(30) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Table created successfully!');

    // Add some sample notifications if table is empty
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM notifications');
    if (rows[0].count === 0) {
        console.log('Adding sample notifications...');
        // We need a user ID. Let's find the first user.
        const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
        if (users.length > 0) {
            const userId = users[0].id;
            await connection.execute(
                'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                [userId, 'Irrigation Due', 'Rice (Boro) needs 120L water by 2:00 PM today.', 'irrigation']
            );
            await connection.execute(
                'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                [userId, 'Disease Alert', 'Leaf spot detected in southern plot. Severe risk.', 'disease']
            );
            console.log('Sample notifications added!');
        }
    }

  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await connection.end();
  }
}

createNotificationsTable();
