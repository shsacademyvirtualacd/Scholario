const http = require('http');

async function testCors() {
  const express = require('express');
  const cors = require('cors');

  const app = express();
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173', 'https://scholario.me'];
  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id'],
    })
  );

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  const server = app.listen(0, '127.0.0.1', async () => {
    const port = server.address().port;
    console.log(`Test server running on port ${port}`);

    function makeRequest(origin) {
      return new Promise((resolve, reject) => {
        const req = http.request(
          {
            hostname: '127.0.0.1',
            port: port,
            path: '/api/health',
            method: 'GET',
            headers: origin ? { Origin: origin } : {},
          },
          (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
          }
        );
        req.on('error', reject);
        req.end();
      });
    }

    try {
      // 1. Allowed origin test
      const res1 = await makeRequest('https://scholario.me');
      console.log('Test 1 (Allowed origin https://scholario.me):', res1.statusCode, res1.headers['access-control-allow-origin']);
      if (res1.headers['access-control-allow-origin'] !== 'https://scholario.me') {
        throw new Error('Test 1 failed: Expected Access-Control-Allow-Origin header');
      }

      // 2. Disallowed origin test
      const res2 = await makeRequest('https://evil-unauthorized-site.com');
      console.log('Test 2 (Disallowed origin https://evil-unauthorized-site.com):', res2.statusCode, res2.headers['access-control-allow-origin']);
      if (res2.headers['access-control-allow-origin']) {
        throw new Error('Test 2 failed: Disallowed origin should not receive Access-Control-Allow-Origin header');
      }

      // 3. No origin test (same-origin / server-to-server)
      const res3 = await makeRequest(null);
      console.log('Test 3 (No origin header):', res3.statusCode);
      if (res3.statusCode !== 200) {
        throw new Error('Test 3 failed: Request without origin header should succeed');
      }

      console.log('✅ ALL CORS VERIFICATION TESTS PASSED SUCCESSFULLY!');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('❌ CORS Verification Test Failed:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

testCors();
