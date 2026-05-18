const axios = require('axios');

(async () => {
    try {
        const res = await axios.post('http://localhost:5001/api/register', {
            fullname: 'Test User 3',
            phone: '01733333333',
            email: 'testuser3@gmail.com',
            division: 'Dhaka',
            password: 'password123',
            role: 'farmer'
        });
        console.log('SUCCESS:', res.data);
    } catch (err) {
        console.error('ERROR:', err.response ? err.response.data : err.message);
    }
})();
