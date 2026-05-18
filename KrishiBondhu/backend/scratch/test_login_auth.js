const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const [rows] = await conn.execute('SELECT * FROM users WHERE email = "manik23@gmail.com"');
    const user = rows[0];

    if (!user) {
      console.log('User manik23@gmail.com not found!');
    } else {
      console.log('User found in DB:', user.fullname, user.email);
      console.log('Hashed password in DB:', user.password_hash);
      
      const match = await bcrypt.compare('password123', user.password_hash);
      console.log('Comparison of "password123":', match);
    }

    await conn.end();
  } catch (err) {
    console.error(err);
  }
})();
