const fs = require('fs');

let createView = fs.readFileSync('src/components/admin/tests/AdminCreateTestView.tsx', 'utf8');

createView = createView.replace(
  "throw new Error(errorData?.error || 'Failed to upload and create test');",
  "throw new Error(errorData?.error || `Upload failed: ${res.status} ${res.statusText}`);"
);

fs.writeFileSync('src/components/admin/tests/AdminCreateTestView.tsx', createView);
