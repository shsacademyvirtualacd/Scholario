const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Let's analyze the math:
// Total required classes per week for G11 & G12:
// FBISE 11:
//   Math: 5
//   Phys: 4
//   Eng: 4
//   Chem: 2
//   Bio: 1
//   Urdu: 2
//   Islamiat: 2
//   Total = 20 classes/week

// Sindh 11:
//   Math: 5 (ALREADY at 19:30 M-F!)
//   Phys: 4
//   Eng: 4
//   Chem: 3
//   Bio: 2
//   Urdu: 2
//   Total in daytime = 15 classes/week (plus 5 at 19:30)

// FBISE 12:
//   Math: 5
//   Phys: 4
//   Eng: 4
//   Chem: 2
//   Bio: 3
//   Urdu: 2
//   Islamiat: 2
//   Total = 22 classes/week

// Sindh 12:
//   Math: 5
//   Phys: 4
//   Eng: 4
//   Chem: 2
//   Bio: 3
//   Urdu: 2
//   Total = 20 classes/week

// Now look at total classes per teacher across G11 & G12:
// 1. Mr. Hashir (Mathematics):
//    - FBISE 11: 5
//    - Sindh 11: 5 (already at 19:30)
//    - FBISE 12: 5
//    - Sindh 12: 5
//    If FBISE 12 and Sindh 12 are SEPARATE: 5 + 5 = 10 Math classes for Grade 12 + 5 for FBISE 11 = 15 classes!
//    Total open slots for Mr. Hashir between P0 and P5: ONLY 11 SLOTS!
//    Therefore, it is MATHEMATICALLY IMPOSSIBLE for FBISE 12 and Sindh 12 to have separate Math classes between P0 and P5 without exceeding Mr. Hashir's available hours!
//    HOWEVER, if FBISE 12 and Sindh 12 have JOINT Grade 12 Math, that is 5 classes.
//    5 (G12 Math) + 5 (FBISE 11 Math) = 10 classes! 10 <= 11!

// What about English (Mr. Husnain)?
// - FBISE 11 Eng: 4
// - Sindh 11 Eng: 4
// - FBISE 12 Eng: 4
// - Sindh 12 Eng: 4
// Total English classes if separate: 16 classes!
// Total open slots for Mr. Husnain in P0-P5:
// Mon: P0, P2, P3, P5 (4)
// Tue: P0, P3, P4, P5 (4)
// Wed: P0, P2, P4, P5 (4)
// Thu: P0, P2, P3, P5 (4)
// Fri: P0, P3, P5 (3)
// Total open slots for Mr. Husnain (excluding P1): 19 slots!
// If joint by grade (Grade 11 English, Grade 12 English): 4 + 4 = 8 classes!

async function testFeasibility() {
  await client.connect();
  console.log('Script loaded successfully.');
  await client.end();
}

testFeasibility();
