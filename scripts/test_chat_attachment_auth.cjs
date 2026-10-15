const assert = require('assert');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rxgrxjlyrfzojvirkhdc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3J4amx5cmZ6b2p2aXJraGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTc3OTksImV4cCI6MjA5ODkzMzc5OX0.ggAT2JiBTg6VG5tbZNnjkig7F73JE0ZzPl_145yuow4';

const supabaseServer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTest() {
  console.log('Testing JWT token verification logic...');

  // 1. Spoofed token with forged base64 payload containing a fake 'sub' claim
  const fakeHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const fakePayload = Buffer.from(JSON.stringify({ sub: 'admin-fake-id-12345', role: 'authenticated' })).toString('base64url');
  const fakeSignature = 'invalid_forged_signature';
  const spoofedToken = `${fakeHeader}.${fakePayload}.${fakeSignature}`;

  console.log('Testing spoofed token verification...');
  const { data: authData, error: authErr } = await supabaseServer.auth.getUser(spoofedToken);

  if (authErr || !authData?.user) {
    console.log('✅ PASS: Spoofed token was properly rejected by Supabase auth.getUser()');
  } else {
    console.error('❌ FAIL: Spoofed token was accepted!');
    process.exit(1);
  }

  // 2. Test invalid string token
  console.log('Testing invalid token string verification...');
  const { data: invalidData, error: invalidErr } = await supabaseServer.auth.getUser('not.a.validtoken');
  if (invalidErr || !invalidData?.user) {
    console.log('✅ PASS: Invalid token string was properly rejected.');
  } else {
    console.error('❌ FAIL: Invalid token was accepted!');
    process.exit(1);
  }

  console.log('\nAll security auth tests passed successfully!');
}

runTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
