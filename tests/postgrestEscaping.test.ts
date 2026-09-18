function escapePostgrestFilterValue(teacherIdentifier: string): string {
  return `"${String(teacherIdentifier).replace(/"/g, '""')}"`;
}

function buildOrFilterString(teacherIdentifier: string): string {
  const safeId = escapePostgrestFilterValue(teacherIdentifier);
  return `id.eq.${safeId},profile_id.eq.${safeId},email.eq.${safeId}`;
}

// Test cases for security validation
const testCases = [
  {
    name: 'Normal UUID',
    input: '123e4567-e89b-12d3-a456-426614174000',
    expected: 'id.eq."123e4567-e89b-12d3-a456-426614174000",profile_id.eq."123e4567-e89b-12d3-a456-426614174000",email.eq."123e4567-e89b-12d3-a456-426614174000"',
  },
  {
    name: 'Normal Email',
    input: 'teacher@example.com',
    expected: 'id.eq."teacher@example.com",profile_id.eq."teacher@example.com",email.eq."teacher@example.com"',
  },
  {
    name: 'Injection payload with comma and extra filter clause',
    input: 'test,role.eq.admin',
    expected: 'id.eq."test,role.eq.admin",profile_id.eq."test,role.eq.admin",email.eq."test,role.eq.admin"',
  },
  {
    name: 'Injection payload with double quotes and PostgREST operator breaking',
    input: 'test",role.eq.admin,"',
    expected: 'id.eq."test"",role.eq.admin,""",profile_id.eq."test"",role.eq.admin,""",email.eq."test"",role.eq.admin,"""',
  },
];

let failed = false;
for (const tc of testCases) {
  const output = buildOrFilterString(tc.input);
  if (output !== tc.expected) {
    console.error(`❌ [FAILED] ${tc.name}\n  Expected: ${tc.expected}\n  Got:      ${output}`);
    failed = true;
  } else {
    console.log(`✅ [PASSED] ${tc.name}`);
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log('\nAll PostgREST filter escaping test cases passed successfully!');
}
