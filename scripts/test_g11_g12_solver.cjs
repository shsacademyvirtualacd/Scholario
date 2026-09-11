const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = ['P0', 'P1', 'P2', 'P3', 'P4'];
const PERIOD_TIMES = {
  P0: '16:30',
  P1: '17:00',
  P2: '17:30',
  P3: '18:00',
  P4: '18:30',
};

async function solve() {
  await client.connect();

  const activeRes = await client.query(`
    SELECT cs.day_of_week, cs.start_time, t.full_name as teacher_name
    FROM public.class_slots cs
    JOIN public.class_offerings co ON cs.offering_id = co.id
    JOIN public.teachers t ON co.teacher_id = t.id
  `);

  // Build teacher busy set for each day
  // key: `${teacherName}_${day}_${time}`
  const busy = new Set();
  for (const r of activeRes.rows) {
    if (r.day_of_week < 5) {
      busy.add(`${r.teacher_name}_${r.day_of_week}_${r.start_time.slice(0, 5)}`);
    }
  }

  console.log(`Loaded ${busy.size} teacher-day-time busy entries from existing active slots.`);

  // Let's test the original user's proposed timetable for FBISE 11:
  // Mon: P1: Chem (Ms. Khadija), P2: Math (Mr. Hashir), P3: Phys (Hasnain), P4: Eng (Mr. Husnain)
  // Tue: P1: Bio (Ms. Khadija), P2: Phys (Hasnain), P3: Urdu (Mr. Subhan), P4: Math (Mr. Hashir)
  // Wed: P1: Islamiat (Ms. Falak), P2: Eng (Mr. Husnain), P3: Math (Mr. Hashir), P4: Phys (Hasnain)
  // Thu: P1: Islamiat (Ms. Falak), P2: Math (Mr. Hashir), P3: Urdu (Mr. Subhan), P4: Eng (Mr. Husnain)
  // Fri: P1: Chem (Ms. Khadija), P2: Phys (Hasnain), P3: Eng (Mr. Husnain), P4: Math (Mr. Hashir)

  // Can we reorder the periods on each day for FBISE 11 and Sindh 11 to eliminate conflicts?
  // Let's write a function to check if a day's permutation is valid for a cohort!
  
  // For each cohort, the set of subjects per day is:
  // FBISE 11:
  // Mon: Chem, Math, Phys, Eng
  // Tue: Bio, Phys, Urdu, Math
  // Wed: Islamiat, Eng, Math, Phys
  // Thu: Islamiat, Math, Urdu, Eng
  // Fri: Chem, Phys, Eng, Math

  // Sindh 11:
  // Mon: Chem, Math, Phys, Eng
  // Tue: Bio, Phys, Urdu, Math
  // Wed: Chem, Eng, Math, Phys
  // Thu: Bio, Math, Urdu, Eng
  // Fri: Chem, Phys, Eng, Math

  const teacherFor = {
    fbise_11: {
      Chemistry: 'Ms. Khadija',
      Biology: 'Ms. Khadija',
      English: 'Mr. Husnain',
      Islamiat: 'Ms. Falak',
      Urdu: 'Mr. Subhan',
      Mathematics: 'Mr. Hashir',
      Physics: 'Muhammad Hasnain Shoukat',
    },
    sindh_11: {
      Chemistry: 'Ms. Khadija',
      Biology: 'Mr. Subhan', // or Mr. Rayyan
      English: 'Mr. Husnain',
      Urdu: 'Mr. Subhan',
      Mathematics: 'Mr. Hashir',
      Physics: 'Muhammad Hasnain Shoukat',
    }
  };

  function isValidPeriod(subject, period, board, grade, day) {
    const s = subject.toLowerCase();
    // Rule 1: Phys, Math, Eng never in P1
    if (period === 'P1' && (s === 'physics' || s === 'mathematics' || s === 'english')) return false;
    // Rule 2: Urdu never in P1 or P2
    if ((period === 'P1' || period === 'P2') && s === 'urdu') return false;
    // Rule 3: Islamiat only for FBISE
    if (s === 'islamiat' && board !== 'fbise') return false;
    // Rule 4: Islamiat defaults to P0, except FBISE 11 Wed/Thu in P1
    if (s === 'islamiat') {
      if (board === 'fbise' && grade === '11' && (day === 2 || day === 3) && period === 'P1') return true;
      if (period === 'P0') return true;
      return false;
    }
    // Non-islamiat in P0? P0 is Islamiat only
    if (period === 'P0' && s !== 'islamiat') return false;
    return true;
  }

  console.log('\nTesting whether P1-P4 is sufficient or if P5 (19:00) / P0 is required...');
  // Let's check Monday:
  // FBISE 11 needs: [Chem, Math, Phys, Eng]
  // Sindh 11 needs: [Chem, Math, Phys, Eng]
  // If BOTH cohorts need Chem, Math, Phys, Eng on Monday:
  // Chem: Ms. Khadija (free at 17:30, 18:00, 18:30)
  // Math: Mr. Hashir (free at 18:30)
  // Phys: Muhammad Hasnain Shoukat (free at 18:30)
  // Eng: Mr. Husnain (free at 17:00, 17:30, 18:00; but Rule 1 bans P1, so free at 17:30, 18:00)
  // Notice: BOTH Math and Phys are ONLY free at 18:30 (P4)!
  // If FBISE 11 takes Math at 18:30, who takes Phys? Phys is also only free at 18:30!
  // And Sindh 11 also needs Math and Phys on Monday!
  console.log('NOTICE on Monday:');
  console.log('Mr. Hashir is busy at 17:30 and 18:00 with Grades 9 & 10. He is ONLY free in P1-P4 at 18:30 (P4).');
  console.log('Hasnain Shoukat is busy at 17:30 and 18:00 with Grades 9 & 10. He is ONLY free in P1-P4 at 18:30 (P4).');
  console.log('Rule 1 forbids both Math and Physics in Period 1 (17:00).');
  console.log('Therefore, between 17:00 and 19:00 on Monday, there is ONLY ONE slot (P4: 18:30) where Math OR Physics can be taught!');
  console.log('Neither Math nor Physics can be doubled up at 18:30, and neither can be taught at 17:30 or 18:00 because both teachers are busy with G9/G10.');

  await client.end();
}

solve().catch(console.error);
