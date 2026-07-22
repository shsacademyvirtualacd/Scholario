import pg from 'pg';

const DB_URL = 'postgresql://postgres.rxgrxjlyrfzojvirkhdc:Marcelmmm23155@@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('--- ADMIN NOTIFICATIONS CHECK ---');

  // 1. Find all Admin users in auth.users and profiles
  const adminUsers = await client.query(`
    SELECT 
      u.id AS auth_uid,
      u.email,
      p.id AS profile_id,
      p.full_name,
      p.role
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE p.role = 'admin' OR u.email LIKE '%admin%';
  `);
  console.log('Admin Users:', adminUsers.rows);

  // 2. Count notifications per admin recipient
  const adminNotifs = await client.query(`
    SELECT 
      n.recipient_id,
      p.full_name,
      p.role,
      u.email,
      count(n.id) AS total_notifs,
      count(CASE WHEN n.is_read = false THEN 1 END) AS unread,
      count(CASE WHEN n.is_read = true THEN 1 END) AS read
    FROM public.notifications n
    JOIN public.profiles p ON p.id = n.recipient_id
    JOIN auth.users u ON u.id = p.id
    WHERE p.role = 'admin'
    GROUP BY n.recipient_id, p.full_name, p.role, u.email;
  `);
  console.log('Admin Notifications in DB:', adminNotifs.rows);

  // 3. Count announcements by scope
  const announcementsCount = await client.query(`
    SELECT scope, count(*) FROM public.announcements GROUP BY scope;
  `);
  console.log('Announcements by Scope:', announcementsCount.rows);

  await client.end();
}

main().catch(console.error);
