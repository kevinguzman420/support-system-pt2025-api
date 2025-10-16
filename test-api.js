const testApiLogin = async () => {
  try {
    console.log('🧪 Testing API login endpoint...');
    
    const response = await fetch('http://localhost:3000/api/public/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001'  // Simulating React app origin
      },
      body: JSON.stringify({
        email: 'client@example.com',
        password: 'demo123'
      })
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response status text:', response.statusText);
    
    // Log response headers
    console.log('📊 Response headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }

    const data = await response.text();
    console.log('📊 Response body:', data);

    if (response.ok) {
      console.log('✅ Login successful!');
      try {
        const jsonData = JSON.parse(data);
        console.log('🎯 Parsed data:', jsonData);
      } catch (e) {
        console.log('⚠️ Could not parse response as JSON');
      }
    } else {
      console.log('❌ Login failed with status:', response.status);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

// Run the test
testApiLogin();