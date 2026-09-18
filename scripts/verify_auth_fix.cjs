const http = require('http');
const { spawn } = require('child_process');

async function main() {
  console.log('Starting local server for auth verification test...');
  const server = spawn('node', ['dist/server.cjs'], {
    env: { ...process.env, PORT: '3000', NODE_ENV: 'production' },
    stdio: 'pipe',
  });

  server.stdout.on('data', (d) => {
    console.log(`[Server]: ${d.toString().trim()}`);
  });
  server.stderr.on('data', (d) => {
    console.error(`[Server Err]: ${d.toString().trim()}`);
  });

  // Wait for server to start listening
  await new Promise((resolve) => {
    server.stdout.on('data', (d) => {
      if (d.toString().includes('running on')) resolve();
    });
    setTimeout(resolve, 5000);
  });

  function makeRequest(headers) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 3000,
          path: '/api/chat/messages/test-msg-123',
          method: 'DELETE',
          headers,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            resolve({ statusCode: res.statusCode, body });
          });
        }
      );
      req.on('error', reject);
      req.end();
    });
  }

  try {
    console.log('\n--- Test 1: Request with ONLY x-user-id header (no Authorization header) ---');
    const res1 = await makeRequest({ 'x-user-id': 'victim-user-id' });
    console.log(`Status Code: ${res1.statusCode}`);
    console.log(`Response Body: ${res1.body}`);
    if (res1.statusCode === 401) {
      console.log('✅ TEST 1 PASSED: Unauthenticated request with x-user-id header was rejected with 401.');
    } else {
      console.error(`❌ TEST 1 FAILED: Expected 401, got ${res1.statusCode}`);
      process.exitCode = 1;
    }

    console.log('\n--- Test 2: Request with forged/fake Bearer token ---');
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ2aWN0aW0tdXNlci1pZCIsInJvbGUiOiJhZG1pbiJ9.fake_signature';
    const res2 = await makeRequest({ Authorization: `Bearer ${fakeToken}` });
    console.log(`Status Code: ${res2.statusCode}`);
    console.log(`Response Body: ${res2.body}`);
    if (res2.statusCode === 401) {
      console.log('✅ TEST 2 PASSED: Request with fake Bearer token was rejected with 401.');
    } else {
      console.error(`❌ TEST 2 FAILED: Expected 401, got ${res2.statusCode}`);
      process.exitCode = 1;
    }

    console.log('\n--- Test 3: Request with x-user-id AND fake Bearer token ---');
    const res3 = await makeRequest({
      'x-user-id': 'victim-user-id',
      Authorization: `Bearer ${fakeToken}`,
    });
    console.log(`Status Code: ${res3.statusCode}`);
    console.log(`Response Body: ${res3.body}`);
    if (res3.statusCode === 401) {
      console.log('✅ TEST 3 PASSED: Request with x-user-id and fake Bearer token was rejected with 401.');
    } else {
      console.error(`❌ TEST 3 FAILED: Expected 401, got ${res3.statusCode}`);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test error:', err);
    process.exitCode = 1;
  } finally {
    server.kill();
  }
}

main();
