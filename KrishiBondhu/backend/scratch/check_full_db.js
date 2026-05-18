const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('--- SHOW TABLES ---');
    const [tables] = await conn.execute('SHOW TABLES');
    console.log(tables);

    for (const tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      console.log(`\n--- COLUMNS IN ${tableName} ---`);
      const [columns] = await conn.execute(`DESCRIBE ${tableName}`);
      console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key })));
    }

    await conn.end();
  } catch (err) {
    console.error(err);
  }
})();
