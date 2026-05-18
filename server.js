// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'krishibondhu',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// attach pool to request for route handlers
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// route imports
const authRouter = require('./routes/auth');
const farmerRouter = require('./routes/farmer');
const weatherRouter = require('./routes/weather');

app.use('/api', authRouter);
app.use('/api/farmer', farmerRouter);
app.use('/api/weather', weatherRouter);

// generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
