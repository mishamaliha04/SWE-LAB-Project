const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'krishibondhu',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Get Weather for Division
router.get('/:division', async (req, res, next) => {
    const division = req.params.division || 'Dhaka';
    
    // Coordinates for Bangladesh Divisions
    const coords = {
        'Dhaka': { lat: 23.8103, lon: 90.4125 },
        'Chittagong': { lat: 22.3569, lon: 91.7832 },
        'Rajshahi': { lat: 24.3745, lon: 88.6042 },
        'Khulna': { lat: 22.8456, lon: 89.5403 },
        'Barisal': { lat: 22.7010, lon: 90.3535 },
        'Sylhet': { lat: 24.8949, lon: 91.8687 },
        'Rangpur': { lat: 25.7439, lon: 89.2752 },
        'Mymensingh': { lat: 24.7471, lon: 90.4203 }
    };

    const location = coords[division] || coords['Dhaka'];

    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&daily=weathercode,temperature_2m_max,relative_humidity_2m_max,windspeed_10m_max&timezone=auto`
        );
        const data = await response.json();

        if (!data.daily) {
            throw new Error('Weather data not found');
        }

        const weatherCodes = {
            0: { icon: '☀️', desc: 'Clear sky' },
            1: { icon: '🌤️', desc: 'Mainly clear' },
            2: { icon: '⛅', desc: 'Partly cloudy' },
            3: { icon: '☁️', desc: 'Overcast' },
            45: { icon: '🌫️', desc: 'Fog' },
            48: { icon: '🌫️', desc: 'Fog' },
            51: { icon: '🌦️', desc: 'Drizzle' },
            53: { icon: '🌦️', desc: 'Drizzle' },
            55: { icon: '🌦️', desc: 'Drizzle' },
            61: { icon: '🌧️', desc: 'Slight rain' },
            63: { icon: '🌧️', desc: 'Moderate rain' },
            65: { icon: '🌧️', desc: 'Heavy rain' },
            71: { icon: '❄️', desc: 'Slight snow' },
            73: { icon: '❄️', desc: 'Moderate snow' },
            75: { icon: '❄️', desc: 'Heavy snow' },
            80: { icon: '🌦️', desc: 'Slight rain showers' },
            81: { icon: '🌦️', desc: 'Moderate rain showers' },
            82: { icon: '🌧️', desc: 'Violent rain showers' },
            95: { icon: '⛈️', desc: 'Thunderstorm' },
            96: { icon: '⛈️', desc: 'Thunderstorm with hail' },
            99: { icon: '⛈️', desc: 'Thunderstorm with hail' },
        };

        const forecast = data.daily.time.slice(0, 5).map((date, idx) => {
            const code = data.daily.weathercode[idx];
            const info = weatherCodes[code] || { icon: '❓', desc: 'Unknown' };
            const dayName = idx === 0 ? 'Today' : (idx === 1 ? 'Tomorrow' : new Date(date).toLocaleDateString('en-US', { weekday: 'long' }));
            
            return {
                day: dayName,
                icon: info.icon,
                desc: info.desc,
                temp: `${Math.round(data.daily.temperature_2m_max[idx])}°C`,
                hum: `${Math.round(data.daily.relative_humidity_2m_max[idx])}%`,
                wind: `${Math.round(data.daily.windspeed_10m_max[idx])} km/h`
            };
        });

        res.json(forecast);
    } catch (err) { 
        console.error('Weather fetch error:', err);
        const dayNames = ['Today', 'Tomorrow', 'Wednesday', 'Thursday', 'Friday'];
        const demoFallback = dayNames.map((day, i) => ({
            day,
            icon: i % 2 === 0 ? '☀️' : '⛅',
            desc: i % 2 === 0 ? 'Sunny' : 'Partly Cloudy',
            temp: `${32 + i}°C`,
            hum: '70%',
            wind: '10 km/h'
        }));
        res.json(demoFallback);
    }
});

// Broadcast Alert
router.post('/alerts/broadcast', async (req, res) => {
    const { officer_id, division, type, title, message, severity, expires_at } = req.body;
    try {
        await pool.query(
            `INSERT INTO emergency_alerts (officer_id, division, type, title, message, severity, expires_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [officer_id, division, type, title, message, severity || 'Warning', expires_at || null]
        );
        res.status(201).json({ message: 'Alert broadcasted successfully' });
    } catch (err) {
        console.error('Error broadcasting alert:', err);
        res.status(500).json({ message: 'Failed to broadcast alert' });
    }
});

// Get Active Alerts by Division
router.get('/alerts/:division', async (req, res) => {
    const { division } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT * FROM emergency_alerts 
             WHERE division = ? AND is_active = 1 
             AND (expires_at IS NULL OR expires_at > NOW())
             ORDER BY created_at DESC`,
            [division]
        );
        res.json(rows);
    } catch (err) {
        console.error('Error fetching alerts:', err);
        res.status(500).json({ message: 'Failed to fetch alerts' });
    }
});

module.exports = router;

