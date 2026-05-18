(async () => {
  console.log('--- TESTING RESTORED ACCOUNT LOGINS ---');
  
  const testLogin = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`SUCCESS [${email}]: Logged in successfully! Role: ${data.role}, Fullname: ${data.fullname}`);
      } else {
        console.error(`FAILED [${email}]: Status ${res.status}`, data);
      }
    } catch (err) {
      console.error(`ERROR [${email}]:`, err.message);
    }
  };

  await testLogin('manik23@gmail.com', 'password123');
  await testLogin('jannatul23@gmail.com', 'password123');
  await testLogin('mehar23@gmail.com', 'password123');
})();
