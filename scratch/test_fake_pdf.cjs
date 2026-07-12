const fs = require('fs');

// Create a fake PDF that is actually just text
fs.writeFileSync('fake.pdf', 'This is a fake PDF file and its magic bytes are wrong.');

// Create a valid JWT dummy (payload {"sub":"87a1b117-4333-4a8a-9c5f-9557f62996fe"})
const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
const payload = Buffer.from(JSON.stringify({ sub: '87a1b117-4333-4a8a-9c5f-9557f62996fe' })).toString('base64url');
const signature = 'dummy';
const jwt = `${header}.${payload}.${signature}`;

async function test() {
  const formData = new FormData();
  
  // Node 20+ has native fetch, FormData, Blob, File
  const fileContent = fs.readFileSync('fake.pdf');
  const file = new File([fileContent], 'fake.pdf', { type: 'application/pdf' });
  
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
