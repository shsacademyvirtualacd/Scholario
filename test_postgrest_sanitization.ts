import { sanitizePostgrestFilterValue } from './src/lib/postgrestSanitizer';

function runTests() {
  console.log('Running PostgREST Filter Sanitization Tests...\n');

  const testCases = [
    {
      name: 'Standard UUID / string',
      input: '123e4567-e89b-12d3-a456-426614174000',
      expected: '"123e4567-e89b-12d3-a456-426614174000"',
    },
    {
      name: 'Standard Email',
      input: 'teacher@example.com',
      expected: '"teacher@example.com"',
    },
    {
      name: 'Empty string',
      input: '',
      expected: '""',
    },
    {
      name: 'Injection via PostgREST comma / filter break',
      input: 'fake_id,user_id.neq.0',
      expected: '"fake_id,user_id.neq.0"',
    },
    {
      name: 'Injection with double quotes',
      input: 'id_val",email.eq."hacked',
      expected: '"id_val\\",email.eq.\\"hacked"',
    },
    {
      name: 'Injection with backslashes and double quotes',
      input: 'test\\\\"foo",bar.eq.baz',
      expected: '"test\\\\\\\\\\"foo\\",bar.eq.baz"',
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const actual = sanitizePostgrestFilterValue(tc.input);
    if (actual === tc.expected) {
      console.log(`✅ [PASS] ${tc.name}`);
      console.log(`   Input:    ${tc.input}`);
      console.log(`   Sanitized: ${actual}\n`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${tc.name}`);
      console.error(`   Input:    ${tc.input}`);
      console.error(`   Expected: ${tc.expected}`);
      console.error(`   Actual:   ${actual}\n`);
      failed++;
    }
  }

  console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
