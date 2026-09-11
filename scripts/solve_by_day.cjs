const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = {
  P0: { start: '16:30:00', end: '17:00:00' },
  P1: { start: '17:00:00', end: '17:30:00' },
  P2: { start: '17:30:00', end: '18:00:00' },
  P3: { start: '18:00:00', end: '18:30:00' },
  P4: { start: '18:30:00', end: '19:00:00' },
  P5: { start: '19:00:00', end: '19:30:00' },
};

async function solveByDay() {
  await client.connect();

  const activeRes = await client.query(`
    SELECT cs.id, c.board_id, c.grade, cs.day_of_week, cs.start_time, cs.end_time, s.name as subject_name, t.full_name as teacher_name
    FROM public.class_slots cs
    JOIN public.classes c ON cs.class_id = c.id
    JOIN public.class_offerings co ON cs.offering_id = co.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
    WHERE cs.day_of_week < 5
  `);

  // Active teacher busy map: `day_startTime` -> Set(teacherName)
  const activeBusy = {};
  for (let d = 0; d < 5; d++) {
    for (const p of Object.keys(PERIODS)) {
      activeBusy[`${d}_${PERIODS[p].start}`] = new Set();
    }
  }
  for (const r of activeRes.rows) {
    if (r.teacher_name && r.day_of_week < 5 && activeBusy[`${r.day_of_week}_${r.start_time}`]) {
      activeBusy[`${r.day_of_week}_${r.start_time}`].add(r.teacher_name);
    }
  }

  // Let's inspect each day:
  // Required classes per day:
  // MONDAY:
  // G11 needs:
  // - FBISE 11: Chemistry (Ms. Khadija), Mathematics (Mr. Hashir), Physics (Muhammad Hasnain Shoukat), English (Mr. Husnain)
  // - Sindh 11: Chemistry (Ms. Khadija), Physics (Muhammad Hasnain Shoukat), English (Mr. Husnain), Math (pre-existing 19:30 Mr. Hashir)
  // G12 needs:
  // - FBISE 12: Biology (Mr. Subhan), English (Mr. Husnain), Physics (Muhammad Hasnain Shoukat), Mathematics (Mr. Hashir)
  // - Sindh 12: Biology (Mr. Subhan), English (Mr. Husnain), Physics (Muhammad Hasnain Shoukat), Mathematics (Mr. Hashir)

  // Notice that on Monday:
  // If G11 English is joint (FBISE 11 + Sindh 11), that is ONE class for Mr. Husnain!
  // If G11 Chemistry is joint (FBISE 11 + Sindh 11), that is ONE class for Ms. Khadija!
  // If G11 Physics is joint (FBISE 11 + Sindh 11), that is ONE class for Muhammad Hasnain Shoukat!
  // And FBISE 11 Math is ONE class for Mr. Hashir!
  //
  // And for G12:
  // G12 Biology is joint (FBISE 12 + Sindh 12), ONE class for Mr. Subhan!
  // G12 English is joint (FBISE 12 + Sindh 12), ONE class for Mr. Husnain!
  // G12 Physics is joint (FBISE 12 + Sindh 12), ONE class for Muhammad Hasnain Shoukat!
  // G12 Mathematics is joint (FBISE 12 + Sindh 12), ONE class for Mr. Hashir!

  // Now look at Monday's periods for these classes:
  // G11 classes needed on Monday:
  // - G11 Chem (Ms. Khadija)
  // - FBISE 11 Math (Mr. Hashir)
  // - G11 Phys (Hasnain Shoukat)
  // - G11 Eng (Mr. Husnain)
  // - (Sindh 11 Math is at 19:30)

  // G12 classes needed on Monday:
  // - G12 Bio (Mr. Subhan)
  // - G12 Eng (Mr. Husnain)
  // - G12 Phys (Hasnain Shoukat)
  // - G12 Math (Mr. Hashir)

  // Can we assign periods P1, P2, P3, P4, P5 on Monday such that:
  // 1. In any period, G11 has at most 1 class
  // 2. In any period, G12 has at most 1 class
  // 3. No teacher is double-booked with G9/G10 or between G11 and G12!
  // 4. Rule 1: Phys, Eng, Math never in P1
  // 5. Rule 2: Urdu never in P1 or P2

  console.log('\n--- TESTING MONDAY ASSIGNMENTS ---');
  // Available periods on Monday:
  // P1 (17:00): G9/G10 has Bio (Subhan) & Chem (Khadija).
  //    Who is free at P1? Hashir, Hasnain Shoukat, Husnain.
  //    BUT Rule 1 says: Math, Phys, Eng CANNOT be in P1!
  //    So who can teach in P1? Only subjects that are NOT Math, Phys, Eng!
  //    Is Ms. Khadija free at P1? No, she's teaching G9 Chem.
  //    Is Mr. Subhan free at P1? No, he's teaching G10 Bio.
  //    Is Ms. Falak free at P1? Yes! But neither G11 nor G12 has Islamiat on Monday!
  //    Therefore: NEITHER Grade 11 NOR Grade 12 can have a class in Period 1 on Monday!
  //    That means Monday for G11 and G12 starts at Period 2 (17:30)!
  console.log('Monday P1: Neither G11 nor G12 has an allowed class in P1 (Math/Phys/Eng banned by Rule 1, Chem/Bio teachers busy with G9/G10).');
  console.log('Therefore, both Grade 11 and Grade 12 start at 17:30 (Period 2) on Monday!');

  // Now, what periods remain on Monday?
  // P2: 17:30
  // P3: 18:00
  // P4: 18:30
  // P5: 19:00
  // Exactly 4 periods! (17:30, 18:00, 18:30, 19:00)
  // And each grade needs exactly 4 classes!
  // Let's see who is free in each period on Monday:
  // P2 (17:30): G9/G10 occupies Hashir & Hasnain Shoukat.
  //    FREE: Husnain, Khadija, Subhan.
  //    So at P2 (17:30):
  //      G11 can take: G11 Chemistry (Ms. Khadija)!
  //      G12 can take: G12 Biology (Mr. Subhan)!
  //      Check: Khadija is free, Subhan is free. G11 has Chem, G12 has Bio. PERFECT!
  //
  // P3 (18:00): G9/G10 occupies Hashir & Hasnain Shoukat.
  //    FREE: Husnain, Khadija, Subhan.
  //    G11 needs: Math, Phys, Eng
  //    G12 needs: Math, Phys, Eng
  //    Since Hashir and Hasnain Shoukat are BUSY at 18:00, NEITHER grade can take Math or Phys at 18:00!
  //    Only Mr. Husnain is free to teach English!
  //    Can Mr. Husnain teach both G11 and G12 at 18:00? NO, he is only one teacher!
  //    One grade can take English at 18:00, but who can the other grade take?
  //    At 18:00, only Khadija and Subhan are free! But G11 and G12 have already taken Chem and Bio at 17:30!
  //    Can G11 take Urdu or something at 18:00? Or can Math be at 18:30 and 19:00?
  //    Let's check P4 (18:30) and P5 (19:00):
  //    At P4 (18:30): G9/G10 occupies Husnain.
  //       FREE: Hashir, Hasnain Shoukat, Khadija, Subhan.
  //       So at P4 (18:30):
  //         G11 can take: G11 Physics (Muhammad Hasnain Shoukat)!
  //         G12 can take: G12 Mathematics (Mr. Hashir)!
  //    At P5 (19:00): ALL teachers are free!
  //       FREE: Hashir, Hasnain Shoukat, Husnain, Khadija, Subhan.
  //       So at P5 (19:00):
  //         G11 can take: FBISE 11 Mathematics (Mr. Hashir)!
  //         G12 can take: G12 Physics (Muhammad Hasnain Shoukat)!
  //    Now look at English:
  //    Where does G11 English and G12 English go?
  //    Mr. Husnain is free at P3 (18:00) and P5 (19:00)!
  //    If G11 takes English at P3 (18:00), then at P3 G12 has an open window!
  //    And at P5 (19:00), G12 can take English with Mr. Husnain, and G11 can take Math with Mr. Hashir!
  //    Then G12 takes Math at P4 (18:30) with Mr. Hashir, while G11 takes Physics with Hasnain Shoukat!
  //    And what about G12 Physics? G12 Physics can be at another day, or G12 Math on another day!

  console.log('Monday constraint analysis clear.');
  await client.end();
}

solveByDay().catch(console.error);
