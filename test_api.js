const http = require('http');

const data = JSON.stringify({
    farmer_ids: [13], // Valid ID for Ratan Miya
    officer_id: 1,  // Valid ID for Maisha Maliha
    message: 'Please submit your soil information for analysis.',
    deadline: '2026-05-18'
});

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/farmer/soil-tests/request-info',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
