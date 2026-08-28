// Run this script to verify DB state after applying the SQL migration
// Usage: node scripts/verify_db.js

const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function main() {
  const [roster, profiles, teachers, enrollments] = await Promise.all([
    sb.from('roster').select('id, email, full_name, role, profile_id').order('created_at'),
    sb.from('profiles').select('id, full_name, role, stream, onboarding_complete').order('created_at'),
    sb.from('teachers').select('id, full_name, email').order('full_name'),
    sb.from('enrollments').select('id, student_id, offering_id'),
  ]);

  console.log('\n=== ROSTER (should have 2 admins) ===');
  console.table(roster.data);
  if (roster.error) console.error('ERROR:', roster.error.message);

  console.log('\n=== PROFILES (should have 2 admins only) ===');
  console.table(profiles.data);
  if (profiles.error) console.error('ERROR:', profiles.error.message);

  console.log('\n=== TEACHERS (should be empty) ===');
  console.table(teachers.data);

  console.log('\n=== ENROLLMENTS (should be empty) ===');
  console.table(enrollments.data);
}

main().catch(console.error);
