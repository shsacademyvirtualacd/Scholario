// Run this script to verify DB state after applying the SQL migration
// Usage: node scripts/verify_db.js

const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://rxgrxjlyrfzojvirkhdc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3J4amx5cmZ6b2p2aXJraGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTc3OTksImV4cCI6MjA5ODkzMzc5OX0.ggAT2JiBTg6VG5tbZNnjkig7F73JE0ZzPl_145yuow4'
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
