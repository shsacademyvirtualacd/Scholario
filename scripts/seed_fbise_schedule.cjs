const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env variables
const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const match = line.trim().match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CLASS_9 = 'e590ccf7-b7b4-4ae6-b6b9-22d068426e1c';
const CLASS_10 = '2bd29023-f3d8-4a5a-b53b-2123a9fed157';
const CLASS_11 = '03dcf96f-5c94-446a-a713-58a00dd2c303';

const PREMED_11 = '4faa2ec9-d105-4bc4-9a4b-ad873a506986';
const PREENG_11 = 'fe500b00-c25d-4ece-bf10-c20f9a275068';

// Grade 9 Offerings
const G9 = {
  BIO: 'b9b2685d-ceac-f578-8f4b-4dc270b01db9',
  CHEM: 'b01c0222-4490-f5f1-d02a-3d367eb407eb',
  ENG: 'c9239184-7b71-5d62-8937-0e0ea269d4bf',
  MATH: 'de4611f9-6ff7-2688-5e09-6f4ec508ebf0',
  PHY: '7ad8c7cc-0767-a165-f588-e7e59d8af395',
  URDU: 'a3a35074-af7c-b67c-2ff8-e0c1eb6ce9f9'
};

// Grade 10 Offerings
const G10 = {
  BIO: 'c0000000-0000-0000-0000-000000000004',
  CHEM: '6b182c36-90a8-9b91-d14a-93ba9cf10823',
  ENG: '794c0c93-243f-7d1f-1218-98a5527c87be',
  MATH: 'ad3e7473-d92e-3756-4665-b6c35b4ee895',
  PHY: '6ec1d912-0b2d-9053-94ce-0f697b5acf96',
  URDU: 'eae3e518-1597-025a-cd9a-a676f0395875'
};

// Grade 11 Offerings
const G11 = {
  BIO: '974a36d4-393d-a673-0858-00a5ad706ba6',
  CHEM: '203f8a84-0589-1fb8-6835-720be540f9ca',
  ENG: '0bd4ee72-9013-8386-24e7-827258a8a888',
  MATH: '53927112-cbea-b149-db8f-0a0054114b41',
  PHY: 'c43550ea-4f47-5471-26a8-c5ad918b5456',
  URDU: '003f2867-6f2e-162f-603e-3aecaba5bfe8'
};

// Islamiat Offering IDs (resolved dynamically at runtime from the database)
let G9_ISL = null;
let G11_ISL = null;

async function resolveIslamiatOfferings() {
  // Grade 9 Islamiat offering
  const { data: g9Data } = await supabase
    .from('class_offerings')
    .select('id, subject:subjects!inner(name), class:classes!inner(grade, board_id)')
    .eq('class.board_id', 'fbise')
    .eq('class.grade', '9')
    .eq('subject.name', 'Islamiat')
    .maybeSingle();
  if (g9Data) G9_ISL = g9Data.id;
  else console.warn('⚠️  Grade 9 Islamiat offering not found — slots will use custom_title fallback');

  // Grade 11 Islamiat offering
  const { data: g11Data } = await supabase
    .from('class_offerings')
    .select('id, subject:subjects!inner(name), class:classes!inner(grade, board_id)')
    .eq('class.board_id', 'fbise')
    .eq('class.grade', '11')
    .eq('subject.name', 'Islamiat')
    .maybeSingle();
  if (g11Data) G11_ISL = g11Data.id;
  else console.warn('⚠️  Grade 11 Islamiat offering not found — slots will use custom_title fallback');

  console.log(`Islamiat offerings resolved: G9=${G9_ISL || 'N/A'}, G11=${G11_ISL || 'N/A'}`);
}

const slotsToInsert = [];

function addSlot(day, start, end, offeringId, classId, customTitle = null, streamId = null, room = 'Room 101') {
  slotsToInsert.push({
    day_of_week: day,
    start_time: start,
    end_time: end,
    offering_id: offeringId,
    class_id: classId,
    custom_title: customTitle,
    stream_id: streamId,
    room_or_link: room,
    is_cancelled: false
  });
}

function buildSlots() {
  slotsToInsert.length = 0; // clear any previous entries

  // ─── CLASS 9 SCHEDULE (Mon=0 to Fri=4) ──────────────────────────────────
  [0, 1, 2, 3, 4].forEach(day => {
    addSlot(day, '16:00:00', '16:30:00', G9.CHEM, CLASS_9);
    addSlot(day, '17:00:00', '17:30:00', G9.MATH, CLASS_9);
    addSlot(day, '17:30:00', '18:00:00', G9.PHY, CLASS_9);
  });

  addSlot(0, '16:30:00', '17:00:00', G9.BIO, CLASS_9);
  addSlot(3, '16:30:00', '17:00:00', G9.BIO, CLASS_9);
  [1, 2, 4].forEach(day => addSlot(day, '16:30:00', '17:00:00', G9_ISL, CLASS_9, G9_ISL ? null : 'Islamiat (Sir Huzaifa)'));

  [0, 2, 3].forEach(day => addSlot(day, '18:00:00', '18:25:00', G9.ENG, CLASS_9));
  [1, 4].forEach(day => addSlot(day, '18:00:00', '18:25:00', G9.URDU, CLASS_9));

  [0, 3].forEach(day => addSlot(day, '18:25:00', '18:50:00', G9.URDU, CLASS_9));
  [1, 2, 4].forEach(day => addSlot(day, '18:25:00', '18:50:00', G9.BIO, CLASS_9));

  // ─── CLASS 10 SCHEDULE (Mon=0 to Fri=4) ─────────────────────────────────
  [0, 1, 2, 3, 4].forEach(day => {
    addSlot(day, '16:00:00', '16:30:00', G10.BIO, CLASS_10);
    addSlot(day, '16:30:00', '17:00:00', G10.CHEM, CLASS_10);
    addSlot(day, '17:00:00', '17:30:00', G10.PHY, CLASS_10);
    addSlot(day, '17:30:00', '18:00:00', G10.MATH, CLASS_10);
  });

  [0, 3].forEach(day => addSlot(day, '18:00:00', '18:25:00', G10.URDU, CLASS_10));
  [1, 4].forEach(day => addSlot(day, '18:00:00', '18:25:00', null, CLASS_10, 'Islamiat (Miss Falak)'));
  addSlot(2, '18:00:00', '18:25:00', G10.ENG, CLASS_10);

  [0, 3].forEach(day => addSlot(day, '18:25:00', '18:50:00', G10.ENG, CLASS_10));
  [1, 4].forEach(day => addSlot(day, '18:25:00', '18:50:00', G10.URDU, CLASS_10));
  addSlot(2, '18:25:00', '18:50:00', null, CLASS_10, 'Islamiat (Miss Falak)');

  // ─── CLASS 11 SCHEDULE (Mon=0 to Fri=4) ─────────────────────────────────
  [0, 1, 2, 3, 4].forEach(day => {
    addSlot(day, '16:30:00', '17:00:00', G11.PHY, CLASS_11);
    addSlot(day, '17:30:00', '18:00:00', G11.CHEM, CLASS_11);
    addSlot(day, '18:00:00', '18:25:00', G11.BIO, CLASS_11, null, PREMED_11, 'Room 101');
    addSlot(day, '18:00:00', '18:25:00', G11.MATH, CLASS_11, null, PREENG_11, 'Room 102');
  });

  [0, 2, 3].forEach(day => addSlot(day, '16:00:00', '16:30:00', G11.ENG, CLASS_11));
  [1, 4].forEach(day => addSlot(day, '16:00:00', '16:30:00', G11.URDU, CLASS_11));

  [0, 2, 3].forEach(day => addSlot(day, '17:00:00', '17:30:00', G11.URDU, CLASS_11));
  [1, 4].forEach(day => addSlot(day, '17:00:00', '17:30:00', G11_ISL, CLASS_11, G11_ISL ? null : 'Islamiat (Miss Falak)'));

  [0, 2, 3].forEach(day => addSlot(day, '18:25:00', '18:50:00', G11_ISL, CLASS_11, G11_ISL ? null : 'Islamiat (Miss Falak)'));
  [1, 4].forEach(day => addSlot(day, '18:25:00', '18:50:00', G11.ENG, CLASS_11));
}

async function seedSchedule() {
  // Resolve Islamiat offering IDs before building slots
  await resolveIslamiatOfferings();

  // Build slots array (must happen after resolveIslamiatOfferings sets G9_ISL / G11_ISL)
  buildSlots();

  console.log('Clearing existing slots for Class 9, 10, 11...');
  const { error: delErr } = await supabase.from('class_slots').delete().in('class_id', [CLASS_9, CLASS_10, CLASS_11]);
  if (delErr) console.error('Error deleting class_slots:', delErr.message);

  const allOffs = [...Object.values(G9), ...Object.values(G10), ...Object.values(G11)];
  if (G9_ISL) allOffs.push(G9_ISL);
  if (G11_ISL) allOffs.push(G11_ISL);
  const { error: delOffErr } = await supabase.from('class_slots').delete().in('offering_id', allOffs);
  if (delOffErr) console.error('Error deleting class_slots by offering:', delOffErr.message);

  console.log(`Inserting ${slotsToInsert.length} official schedule slots from fbise_weekly_schedule.md...`);
  const { data, error } = await supabase.from('class_slots').insert(slotsToInsert).select();
  if (error) {
    console.error('Failed to insert slots:', error.message, error.details);
  } else {
    console.log(`Successfully inserted ${data.length} schedule slots!`);
  }
}

seedSchedule();
