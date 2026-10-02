import { generateUniqueNumericStudentId } from './studentId';

// Quick assert helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('Running studentId tests...');

  // Test range and digit count over multiple iterations
  for (let i = 0; i < 100; i++) {
    const id = await generateUniqueNumericStudentId();
    const num = Number(id);
    assert(/^\d{4,5}$/.test(id), `ID "${id}" should be 4 or 5 digits`);
    assert(num >= 1000 && num <= 99999, `ID ${num} out of bounds [1000, 99999]`);
  }

  console.log('All studentId tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
