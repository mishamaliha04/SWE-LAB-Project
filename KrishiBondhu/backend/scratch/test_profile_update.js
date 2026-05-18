(async () => {
  console.log('--- TESTING PROFILE UPDATES WITH NATIVE FETCH ---');
  
  // Helper for PUT request
  const testPut = async (url, body) => {
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`SUCCESS [${url}]:`, data);
      } else {
        console.error(`FAILED [${url}]: Status ${res.status}`, data);
      }
    } catch (err) {
      console.error(`ERROR [${url}]:`, err.message);
    }
  };

  // 1. Farmer Profile Update
  console.log('\nTesting Farmer profile update...');
  await testPut('http://localhost:5001/api/farmer/1/profile?role=farmer', {
    fullname: 'Manik Miya Update',
    phone: '01733333333',
    email: 'manik23@gmail.com',
    division: 'Rangpur',
    total_land_area: '5 acres',
    soil_type: 'Clay'
  });

  // 2. Agri-Officer Profile Update
  console.log('\nTesting Agri-Officer profile update...');
  await testPut('http://localhost:5001/api/farmer/1/profile?role=officer', {
    fullname: 'Jannatul Aurpy Update',
    phone: '01733333333',
    email: 'jannatul23@gmail.com',
    division: 'Rangpur',
    designation: 'Senior Agricultural Officer'
  });

  // 3. Researcher Profile Update
  console.log('\nTesting Researcher profile update...');
  await testPut('http://localhost:5001/api/farmer/1/profile?role=researcher', {
    fullname: 'Mehar Nigar Update',
    phone: '01733333333',
    email: 'mehar23@gmail.com',
    division: 'Rangpur',
    designation: 'Principal Researcher',
    education: 'PhD in Agronomy',
    experience_years: 10
  });

})();
