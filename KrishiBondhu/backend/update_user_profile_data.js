const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Updating users table schema...');
    
    const columns = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS total_land_area VARCHAR(50) DEFAULT "0 acres"',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS soil_type VARCHAR(50) DEFAULT "Not specified"',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS water_source VARCHAR(100) DEFAULT "Not specified"',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS farming_since VARCHAR(50) DEFAULT "2024"',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS ph_level VARCHAR(20) DEFAULT "7.0"',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS sand_pct INT DEFAULT 0',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS silt_pct INT DEFAULT 0',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS clay_pct INT DEFAULT 0'
    ];

    for (const sql of columns) {
      try {
        await connection.execute(sql);
      } catch (err) {
        // Ignore if column already exists (though IF NOT EXISTS is used)
        console.log(`Column update: ${sql.split('ADD COLUMN')[1].split(' ')[1]} - ${err.message}`);
      }
    }

    console.log('Schema updated successfully!');

    // Update Manik Miya if he exists
    const [users] = await connection.execute('SELECT id FROM users WHERE fullname LIKE "%Manik%" LIMIT 1');
    if (users.length > 0) {
      const userId = users[0].id;
      console.log(`Updating data for user ID: ${userId} (Manik Miya)`);
      await connection.execute(`
        UPDATE users SET 
          total_land_area = "4.5 acres",
          soil_type = "Loamy Soil (Sandy Loam)",
          water_source = "Deep Tubewell & Canal (Borewell + Canal)",
          farming_since = "2019",
          ph_level = "6.2",
          sand_pct = 60,
          silt_pct = 25,
          clay_pct = 15
        WHERE id = ?
      `, [userId]);
      console.log('Manik Miya data updated!');
    } else {
        // If no Manik Miya, update the first user for testing
        const [anyUser] = await connection.execute('SELECT id FROM users LIMIT 1');
        if (anyUser.length > 0) {
            console.log('Updating first user for testing...');
            await connection.execute(`
                UPDATE users SET 
                  total_land_area = "4.5 acres",
                  soil_type = "Loamy Soil (Sandy Loam)",
                  water_source = "Deep Tubewell & Canal (Borewell + Canal)",
                  farming_since = "2019",
                  ph_level = "6.2",
                  sand_pct = 60,
                  silt_pct = 25,
                  clay_pct = 15
                WHERE id = ?
            `, [anyUser[0].id]);
        }
    }

  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    await connection.end();
  }
}

updateSchema();
