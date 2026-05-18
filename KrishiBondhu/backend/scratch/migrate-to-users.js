const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Starting migration...');

    // 1. Prepare users table
    console.log('Cleaning up users table...');
    await connection.execute('TRUNCATE TABLE users'); // Start fresh in users if any junk exists

    console.log('Modifying users table schema...');
    // Add unique constraint and rename password column if needed
    // First, let's drop any foreign keys pointing to farmers to avoid lock issues
    const [fks] = await connection.execute(`
      SELECT TABLE_NAME, CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_NAME = 'farmers' AND TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);

    for (const fk of fks) {
      console.log(`Dropping FK ${fk.CONSTRAINT_NAME} from ${fk.TABLE_NAME}...`);
      await connection.execute(`ALTER TABLE ${fk.TABLE_NAME} DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
    }

    // Rename password to password_hash and adjust types
    await connection.execute('ALTER TABLE users CHANGE COLUMN password password_hash VARCHAR(255) NOT NULL');
    await connection.execute('ALTER TABLE users MODIFY COLUMN fullname VARCHAR(100) NOT NULL');
    await connection.execute('ALTER TABLE users MODIFY COLUMN phone VARCHAR(20) NOT NULL');
    await connection.execute('ALTER TABLE users MODIFY COLUMN email VARCHAR(100) NOT NULL');
    await connection.execute('ALTER TABLE users ADD UNIQUE (email)');
    await connection.execute('ALTER TABLE users MODIFY COLUMN division VARCHAR(50) NOT NULL');
    await connection.execute('ALTER TABLE users MODIFY COLUMN role VARCHAR(20) DEFAULT "farmer"');

    // 2. Move data from farmers to users
    console.log('Migrating data from farmers to users...');
    await connection.execute(`
      INSERT INTO users (id, fullname, phone, email, division, password_hash, role, created_at)
      SELECT id, fullname, phone, email, division, password_hash, role, created_at FROM farmers
    `);

    // 3. Restore Foreign Keys pointing to users
    console.log('Re-creating foreign keys pointing to users...');
    await connection.execute('ALTER TABLE crops ADD CONSTRAINT fk_crops_user FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE');
    await connection.execute('ALTER TABLE irrigation ADD CONSTRAINT fk_irrigation_user FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE');
    await connection.execute('ALTER TABLE diseases ADD CONSTRAINT fk_diseases_user FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE');
    await connection.execute('ALTER TABLE fertilizer_logs ADD CONSTRAINT fk_fert_user FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE');

    // 4. Drop farmers table
    console.log('Dropping farmers table...');
    await connection.execute('DROP TABLE farmers');

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migrate();
