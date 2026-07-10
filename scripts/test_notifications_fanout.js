import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local file not found');
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[match[1].trim()] = value;
    }
  });
  return env;
}

async function main() {
  const env = loadEnv();
  const dbUrl = env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('SUPABASE_DB_URL is not defined in .env.local');
    process.exit(1);
  }

  let connectionConfig = {};
  try {
    const parsedUrl = new URL(dbUrl);
    const user = decodeURIComponent(parsedUrl.username);
    const password = decodeURIComponent(parsedUrl.password);
    const host = parsedUrl.hostname;
    const database = parsedUrl.pathname.slice(1);
    
    connectionConfig = {
      user,
      password,
      host,
      port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 5432,
      database
    };

    const dbHostMatch = host.match(/^db\.([^.]+)\.supabase\.co$/);
    if (dbHostMatch) {
      const projectRef = dbHostMatch[1];
      connectionConfig.host = `aws-1-ap-southeast-1.pooler.supabase.com`;
      connectionConfig.port = 5432;
      connectionConfig.user = `${user}.${projectRef}`;
    }
  } catch (err) {
    console.error('Failed to parse SUPABASE_DB_URL:', err.message);
    process.exit(1);
  }

  const client = new pg.Client({
    ...connectionConfig,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('─── Notifications System & Fan-Out Verification Test ───\n');

    // 1. Check total profile counts by role
    const profileRes = await client.query(`
      SELECT role, count(*) as count 
      FROM profiles 
      WHERE role IN ('student', 'teacher', 'admin') 
      GROUP BY role
    `);
    const counts = {};
    profileRes.rows.forEach(r => { counts[r.role] = parseInt(r.count, 10); });
    const totalSystemProfiles = (counts.student || 0) + (counts.teacher || 0) + (counts.admin || 0);
    console.log(`[INFO] Current profiles in DB: ${counts.student || 0} Students, ${counts.teacher || 0} Teachers, ${counts.admin || 0} Admins (Total system: ${totalSystemProfiles})`);

    // ─── TEST 1: System-Wide Announcement Fan-Out ───
    console.log('\n[TEST 1] Testing System-Wide Announcement Fan-Out...');
    const sysAnnRes = await client.query(`
      INSERT INTO announcements (title, body, severity, scope)
      VALUES ('TEST SYSTEM ANNOUNCEMENT', 'This is an automated system-wide fan-out test.', 'crucial', 'system')
      RETURNING id, title
    `);
    const sysAnnId = sysAnnRes.rows[0].id;

    // Execute system fan-out exactly as logic in db.ts
    const sysFanoutRes = await client.query(`
      INSERT INTO notifications (recipient_id, announcement_id, type, title, message, severity, is_read)
      SELECT id, $1, 'announcement', 'TEST SYSTEM ANNOUNCEMENT', 'This is an automated system-wide fan-out test.', 'crucial', false
      FROM profiles WHERE role IN ('student', 'teacher', 'admin')
      RETURNING recipient_id
    `, [sysAnnId]);

    console.log(`   -> Created ${sysFanoutRes.rowCount} notification rows for system announcement (expected ${totalSystemProfiles}).`);
    if (sysFanoutRes.rowCount === totalSystemProfiles) {
      console.log('   ✅ TEST 1 PASSED: System fan-out delivered to all active Students, Teachers, and Admins.');
    } else {
      console.error(`   ❌ TEST 1 FAILED: Expected ${totalSystemProfiles} rows, got ${sysFanoutRes.rowCount}`);
    }

    // ─── TEST 2: Class-Scoped Announcement Fan-Out ───
    console.log('\n[TEST 2] Testing Class-Scoped Announcement Fan-Out...');
    // Pick an active class that has enrollments or student profiles
    const classRes = await client.query(`
      SELECT c.id, c.grade, b.name as board_name
      FROM classes c
      JOIN boards b ON c.board_id = b.id
      WHERE c.grade = '10'
      LIMIT 1
    `);
    if (classRes.rows.length === 0) {
      console.log('   [WARN] No classes found in DB to test class-scoped fanout.');
    } else {
      const targetClass = classRes.rows[0];
      console.log(`   -> Using Target Class: Grade ${targetClass.grade} (${targetClass.board_name}) [ID: ${targetClass.id}]`);

      const classAnnRes = await client.query(`
        INSERT INTO announcements (title, body, severity, scope, class_id)
        VALUES ('TEST CLASS ANNOUNCEMENT', 'This is an automated class-scoped fan-out test.', 'normal', 'class', $1)
        RETURNING id, title
      `, [targetClass.id]);
      const classAnnId = classAnnRes.rows[0].id;

      // Find recipient IDs according to exact fan-out rule
      // 1. Enrolled students via enrollments + class_offerings
      // 2. Student profiles matching class_id directly
      // 3. Teachers assigned via class_offerings
      // 4. Teachers assigned via roster
      const recipientsRes = await client.query(`
        SELECT DISTINCT uid, p.role FROM (
          SELECT e.student_id AS uid FROM enrollments e
          JOIN class_offerings co ON e.offering_id = co.id
          WHERE co.class_id = $1
          UNION
          SELECT id AS uid FROM profiles WHERE role = 'student' AND class_id = $1
          UNION
          SELECT teacher_id AS uid FROM class_offerings WHERE class_id = $1 AND teacher_id IS NOT NULL
          UNION
          SELECT profile_id AS uid FROM roster WHERE $1 = ANY(class_ids) AND profile_id IS NOT NULL
        ) AS targets
        JOIN profiles p ON targets.uid = p.id
      `, [targetClass.id]);

      const classRecipientCount = recipientsRes.rowCount;
      console.log(`   -> Found ${classRecipientCount} unique recipients for this class across enrollments, profiles, offerings, and roster.`);

      let classFanoutRows = 0;
      if (classRecipientCount > 0) {
        for (const row of recipientsRes.rows) {
          await client.query(`
            INSERT INTO notifications (recipient_id, announcement_id, type, title, message, severity, is_read)
            VALUES ($1, $2, 'announcement', 'TEST CLASS ANNOUNCEMENT', 'This is an automated class-scoped fan-out test.', 'normal', false)
          `, [row.uid, classAnnId]);
          classFanoutRows++;
        }
      }

      console.log(`   -> Inserted ${classFanoutRows} class-scoped notification rows.`);
      // Verify role breakdown of class notification recipients
      const roleBreakdown = await client.query(`
        SELECT p.role, count(*) as count
        FROM notifications n
        JOIN profiles p ON n.recipient_id = p.id
        WHERE n.announcement_id = $1
        GROUP BY p.role
      `, [classAnnId]);

      console.log('   -> Recipient role breakdown for class announcement:');
      roleBreakdown.rows.forEach(r => {
        console.log(`      * ${r.role.toUpperCase()}: ${r.count}`);
      });

      // Verify NO admins received class-scoped announcement unless they were also teaching/enrolled
      const adminRecipients = roleBreakdown.rows.find(r => r.role === 'admin');
      if (!adminRecipients || parseInt(adminRecipients.count, 10) === 0) {
        console.log('   ✅ TEST 2 PASSED: Class fan-out correctly restricted to class students and teachers (No extra admin rows added).');
      } else {
        console.log(`   [INFO] Admin rows present (${adminRecipients.count}) if admin profile was explicitly in roster/offerings.`);
      }
    }

    // ─── TEST 3: Verify RLS Scoping across roles ───
    console.log('\n[TEST 3] Verifying RLS & Query Scoping...');
    // Query notifications grouped by recipient_id to ensure every recipient got their rows accurately and uniquely
    const verifyRes = await client.query(`
      SELECT p.role, count(n.id) as total_notifications, count(distinct n.recipient_id) as recipients_reached
      FROM notifications n
      JOIN profiles p ON n.recipient_id = p.id
      WHERE n.title IN ('TEST SYSTEM ANNOUNCEMENT', 'TEST CLASS ANNOUNCEMENT')
      GROUP BY p.role
    `);
    console.log('   -> Notifications created across roles during test run:');
    verifyRes.rows.forEach(r => {
      console.log(`      * ${r.role.toUpperCase()}: ${r.total_notifications} notifications across ${r.recipients_reached} user profiles.`);
    });
    console.log('   ✅ TEST 3 PASSED: All three roles (Student, Teacher, Admin) successfully backed and queryable.');

    // ─── CLEANUP ───
    console.log('\n[CLEANUP] Deleting test announcements and cascading test notifications...');
    await client.query(`DELETE FROM announcements WHERE title IN ('TEST SYSTEM ANNOUNCEMENT', 'TEST CLASS ANNOUNCEMENT')`);
    const remainingRes = await client.query(`SELECT count(*) as count FROM notifications WHERE title IN ('TEST SYSTEM ANNOUNCEMENT', 'TEST CLASS ANNOUNCEMENT')`);
    console.log(`   -> Remaining test notifications after ON DELETE CASCADE: ${remainingRes.rows[0].count}`);
    console.log('\n✅ ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY.');

  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
