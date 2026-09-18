import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

console.log('Running security fix verification tests...');

// 1. Static AST/Content Check: Verify no hardcoded JWT anon keys exist in src/ or functions/ or server.ts
const targetFiles = [
  'src/lib/supabase.ts',
  'functions/_lib/supabaseAuth.ts',
  'functions/api/sage/chat.ts',
  'server.ts',
  'wrangler.toml',
];

const vulnerableKeyPattern = /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;

for (const relPath of targetFiles) {
  const fullPath = path.resolve(relPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    assert.strictEqual(
      vulnerableKeyPattern.test(content),
      false,
      `Vulnerability detected: Hardcoded JWT key found in ${relPath}`
    );
    console.log(`✓ Verified ${relPath}: No hardcoded JWT keys found.`);
  }
}

// 2. Dynamic Behavior Check: Verify src/lib/supabase.ts throws when env vars are absent
try {
  // Clear environment variables
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.VITE_SUPABASE_ANON_KEY;

  let threw = false;
  try {
    // Dynamic import to trigger evaluation
    await import(`../src/lib/supabase.ts?update=${Date.now()}`);
  } catch (err: any) {
    threw = true;
    assert.ok(
      err.message.includes('Missing required Supabase configuration'),
      `Unexpected error message: ${err.message}`
    );
  }

  assert.strictEqual(threw, true, 'Expected src/lib/supabase.ts to throw when environment variables are missing!');
  console.log('✓ Verified src/lib/supabase.ts throws an Error when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing.');
} catch (err) {
  console.error('Test failed:', err);
  process.exit(1);
}

console.log('All security fix verification tests passed successfully!');
