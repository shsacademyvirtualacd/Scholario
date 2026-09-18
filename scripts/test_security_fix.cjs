const http = require('http');

// Test script to verify that fake JWT tokens (crafted base64 strings) are rejected
// and do not grant unauthorized access to server endpoints.

async function testFakeJwtSecurity() {
  console.log('--- Testing Insecure Authentication Handling (Fake JWTs) ---');

  // Craft fake JWT header with sub: "hacker-123" and role: "admin"
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    sub: 'hacker-user-id-999',
    role: 'admin',
    user_metadata: { role: 'admin' },
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64');
  const signature = 'fake_signature_hash';
  const fakeToken = `${header}.${payload}.${signature}`;

  console.log('Crafted Fake JWT Token:', fakeToken.slice(0, 30) + '...');

  // Test 1: Chat message deletion with fake token
  const req1Options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/chat/messages/test-msg-id-123',
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${fakeToken}`,
      'Content-Type': 'application/json'
    }
  };

  const status1 = await sendRequest(req1Options);
  console.log(`[Test 1] DELETE /api/chat/messages/:id with Fake JWT -> Response Status: ${status1}`);

  if (status1 === 401) {
    console.log('✅ PASS: Server correctly rejected fake JWT with HTTP 401 Unauthorized.');
  } else {
    console.error(`❌ FAIL: Server accepted or responded with status ${status1} instead of 401.`);
    process.exit(1);
  }

  // Test 2: Chat attachment access with fake token
  const req2Options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/chat/attachment/conv1%2Fhacker-user-id-999%2Ffile.pdf',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${fakeToken}`
    }
  };

  const status2 = await sendRequest(req2Options);
  console.log(`[Test 2] GET /api/chat/attachment/:key with Fake JWT -> Response Status: ${status2}`);

  if (status2 === 401) {
    console.log('✅ PASS: Server correctly rejected fake JWT with HTTP 401 Unauthorized.');
  } else {
    console.error(`❌ FAIL: Server accepted or responded with status ${status2} instead of 401.`);
    process.exit(1);
  }

  console.log('\nAll fake JWT security validation tests passed successfully!');
}

function sendRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      resolve(res.statusCode);
    });
    req.on('error', (err) => {
      reject(err);
    });
    req.end();
  });
}

testFakeJwtSecurity().catch((err) => {
  console.error('Test execution error:', err.message);
  process.exit(1);
});
