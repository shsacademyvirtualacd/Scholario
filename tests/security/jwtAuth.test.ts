import { createClient } from '@supabase/supabase-js';

// Standalone executable security test for JWT authentication signature verification
async function runJwtSecurityTests() {
  console.log('🔒 Running Security Verification Tests for JWT Authentication...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Create a forged JWT token with forged "sub" and "admin" role
  const forgedHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const forgedPayload = Buffer.from(JSON.stringify({
    sub: 'attacker-spoofed-user-id-999',
    role: 'admin',
    email: 'attacker@malicious.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64url');
  const forgedSignature = 'fake_signature_1234567890';
  const forgedToken = `${forgedHeader}.${forgedPayload}.${forgedSignature}`;

  console.log('Test 1: Verification of forged JWT token against Supabase Auth');

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rxgrxjlyrfzojvirkhdc.supabase.co';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'anon_key_placeholder';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: authData, error: authErr } = await supabase.auth.getUser(forgedToken);

  assert(authErr !== null || !authData?.user, 'Forged JWT token is rejected by Supabase Auth API');
  assert(authData?.user?.id !== 'attacker-spoofed-user-id-999', 'Forged userId claim is NOT trusted');

  console.log('\nTest 2: Verification of malformed JWT token string');
  const malformedToken = 'not.a.valid.jwt.string';
  const { data: malformedData, error: malformedErr } = await supabase.auth.getUser(malformedToken);
  assert(malformedErr !== null || !malformedData?.user, 'Malformed JWT token is safely rejected');

  console.log('\nTest 3: Verification of empty token');
  const { data: emptyData, error: emptyErr } = await supabase.auth.getUser('');
  assert(emptyErr !== null || !emptyData?.user, 'Empty token returns error / null user');

  console.log(`\n----------------------------------------`);
  console.log(`Security Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`----------------------------------------\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runJwtSecurityTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
