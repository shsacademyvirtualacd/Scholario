const fs = require('fs');

// Create a valid dummy PDF file (just the header is enough to pass validation)
fs.writeFileSync('real.pdf', Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A, 0x0A]));

const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
const payload = Buffer.from(JSON.stringify({ sub: '87a1b117-4333-4a8a-9c5f-9557f62996fe' })).toString('base64url');
const signature = 'dummy';
const jwt = `${header}.${payload}.${signature}`;

async function test() {
  const formData = new FormData();
  
  const fileContent = fs.readFileSync('real.pdf');
  const file = new File([fileContent], 'real.pdf', { type: 'application/pdf' });
  
  formData.append('file', file);
  formData.append('offering_id', 'some-id');
  formData.append('chapter_name', 'Test Chapter');
  formData.append('title', 'Test Title');
  formData.append('file_type', 'pdf');

  try {
    const res = await fetch('http://localhost:8788/api/notes/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`
      },
      body: formData
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

test();
