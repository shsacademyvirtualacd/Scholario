const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

const PERIOD_TIMES = {
  P0: { start: '16:30:00', end: '17:00:00' },
  P1: { start: '17:00:00', end: '17:30:00' },
  P2: { start: '17:30:00', end: '18:00:00' },
  P3: { start: '18:00:00', end: '18:30:00' },
  P4: { start: '18:30:00', end: '19:00:00' },
};

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// The timetable previously proposed for Grades 11 and 12
const PROPOSED_G11_G12 = {
  fbise: {
    '11': [
      // Mon
      { day: 0, period: 'P1', subject: 'Chemistry' },
      { day: 0, period: 'P2', subject: 'Mathematics' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'English' },
      // Tue
      { day: 1, period: 'P1', subject: 'Biology' },
      { day: 1, period: 'P2', subject: 'Physics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Mathematics' },
      // Wed (Islamiat exception applies: P1)
      { day: 2, period: 'P1', subject: 'Islamiat' },
      { day: 2, period: 'P2', subject: 'English' },
      { day: 2, period: 'P3', subject: 'Mathematics' },
      { day: 2, period: 'P4', subject: 'Physics' },
      // Thu (Islamiat exception applies: P1)
      { day: 3, period: 'P1', subject: 'Islamiat' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri
      { day: 4, period: 'P1', subject: 'Chemistry' },
      { day: 4, period: 'P2', subject: 'Physics' },
      { day: 4, period: 'P3', subject: 'English' },
      { day: 4, period: 'P4', subject: 'Mathematics' },
    ],
    '12': [
      // Mon
      { day: 0, period: 'P1', subject: 'Biology' },
      { day: 0, period: 'P2', subject: 'English' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'Mathematics' },
      // Tue
      { day: 1, period: 'P0', subject: 'Islamiat' },
      { day: 1, period: 'P1', subject: 'Chemistry' },
      { day: 1, period: 'P2', subject: 'Mathematics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Physics' },
      // Wed
      { day: 2, period: 'P1', subject: 'Biology' },
      { day: 2, period: 'P2', subject: 'Physics' },
      { day: 2, period: 'P3', subject: 'English' },
      { day: 2, period: 'P4', subject: 'Mathematics' },
      // Thu
      { day: 3, period: 'P0', subject: 'Islamiat' },
      { day: 3, period: 'P1', subject: 'Chemistry' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri
      { day: 4, period: 'P1', subject: 'Biology' },
      { day: 4, period: 'P2', subject: 'English' },
      { day: 4, period: 'P3', subject: 'Mathematics' },
      { day: 4, period: 'P4', subject: 'Physics' },
    ],
  },
  sindh: {
    '11': [
      // Mon
      { day: 0, period: 'P1', subject: 'Chemistry' },
      { day: 0, period: 'P2', subject: 'Mathematics' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'English' },
      // Tue
      { day: 1, period: 'P1', subject: 'Biology' },
      { day: 1, period: 'P2', subject: 'Physics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Mathematics' },
      // Wed
      { day: 2, period: 'P1', subject: 'Chemistry' },
      { day: 2, period: 'P2', subject: 'English' },
      { day: 2, period: 'P3', subject: 'Mathematics' },
      { day: 2, period: 'P4', subject: 'Physics' },
      // Thu
      { day: 3, period: 'P1', subject: 'Biology' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri
      { day: 4, period: 'P1', subject: 'Chemistry' },
      { day: 4, period: 'P2', subject: 'Physics' },
      { day: 4, period: 'P3', subject: 'English' },
      { day: 4, period: 'P4', subject: 'Mathematics' },
    ],
    '12': [
      // Mon
      { day: 0, period: 'P1', subject: 'Biology' },
      { day: 0, period: 'P2', subject: 'English' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'Mathematics' },
      // Tue
      { day: 1, period: 'P1', subject: 'Chemistry' },
      { day: 1, period: 'P2', subject: 'Mathematics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Physics' },
      // Wed
      { day: 2, period: 'P1', subject: 'Biology' },
      { day: 2, period: 'P2', subject: 'Physics' },
      { day: 2, period: 'P3', subject: 'English' },
      { day: 2, period: 'P4', subject: 'Mathematics' },
      // Thu
      { day: 3, period: 'P1', subject: 'Chemistry' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      // Fri
      { day: 4, period: 'P1', subject: 'Biology' },
      { day: 4, period: 'P2', subject: 'English' },
      { day: 4, period: 'P3', subject: 'Mathematics' },
      { day: 4, period: 'P4', subject: 'Physics' },
    ],
  }
};

async function main() {
  await client.connect();

  console.log('================================================================');
  console.log('TASK 1: REAL TEACHER ASSIGNMENTS FOR GRADES 11 & 12');
  console.log('================================================================');

  const offeringsQuery = `
    SELECT 
      c.board_id, 
      c.grade, 
      c.display_name as class_name,
      s.name as subject_name, 
      co.id as offering_id, 
      co.teacher_id, 
      t.full_name as teacher_name,
      t.email as teacher_email
    FROM public.classes c
    JOIN public.class_offerings co ON co.class_id = c.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
    WHERE c.grade IN ('11', '12') AND c.board_id IN ('fbise', 'sindh')
    ORDER BY c.board_id, c.grade, s.name
  `;
  const offeringsRes = await client.query(offeringsQuery);
  console.table(offeringsRes.rows);

  // Map: `${board}_${grade}_${subject}` -> { teacherId, teacherName }
  const offeringTeacherMap = {};
  for (const r of offeringsRes.rows) {
    const key = `${r.board_id}_${r.grade}_${r.subject_name.toLowerCase()}`;
    offeringTeacherMap[key] = {
      teacherId: r.teacher_id,
      teacherName: r.teacher_name
    };
  }

  // Also query what teachers teach these subjects in other grades (or general subject specialists)
  console.log('\n================================================================');
  console.log('TASK 1 (Supplement): SUBJECT SPECIALISTS IN THE REST OF DB');
  console.log('================================================================');
  const allOfferings = await client.query(`
    SELECT c.board_id, c.grade, s.name as subject_name, t.full_name as teacher_name
    FROM public.class_offerings co
    JOIN public.classes c ON co.class_id = c.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
    WHERE t.id IS NOT NULL
    ORDER BY s.name, c.board_id, c.grade
  `);
  console.table(allOfferings.rows);

  console.log('\n================================================================');
  console.log('TASK 2: CURRENTLY ACTIVE SLOTS IN DB (GRADES 9, 10, SINDH 11 MATH)');
  console.log('================================================================');
  const activeSlotsQuery = `
    SELECT 
      cs.id as slot_id,
      c.board_id,
      c.grade,
      c.display_name as class_name,
      cs.day_of_week,
      cs.start_time,
      cs.end_time,
      s.name as subject_name,
      t.id as teacher_id,
      t.full_name as teacher_name
    FROM public.class_slots cs
    JOIN public.classes c ON cs.class_id = c.id
    JOIN public.class_offerings co ON cs.offering_id = co.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
    ORDER BY cs.day_of_week, cs.start_time, c.board_id, c.grade
  `;
  const activeSlotsRes = await client.query(activeSlotsQuery);
  console.log(`Found ${activeSlotsRes.rows.length} existing scheduled slots.`);

  // Let's also check teacher conflicts WITHIN existing active slots (e.g. between G9 and G10)
  console.log('\n================================================================');
  console.log('TASK 2b: CHECKING CONFLICTS AMONG CURRENTLY ACTIVE G9/G10 SLOTS');
  console.log('================================================================');
  const existingConflicts = [];
  for (let i = 0; i < activeSlotsRes.rows.length; i++) {
    for (let j = i + 1; j < activeSlotsRes.rows.length; j++) {
      const a = activeSlotsRes.rows[i];
      const b = activeSlotsRes.rows[j];
      if (
        a.teacher_id && 
        b.teacher_id && 
        a.teacher_id === b.teacher_id && 
        a.day_of_week === b.day_of_week && 
        a.start_time === b.start_time
      ) {
        existingConflicts.push({
          teacher: a.teacher_name,
          day: DAY_NAMES[a.day_of_week],
          time: `${a.start_time} - ${a.end_time}`,
          classA: `${a.board_id.toUpperCase()} Grade ${a.grade} (${a.subject_name})`,
          classB: `${b.board_id.toUpperCase()} Grade ${b.grade} (${b.subject_name})`,
        });
      }
    }
  }
  console.log(`Found ${existingConflicts.length} teacher double-booking conflicts among currently active G9/G10 slots:`);
  console.table(existingConflicts);

  console.log('\n================================================================');
  console.log('TASK 3: CROSS-REFERENCING PROPOSED GRADE 11 & 12 SLOTS AGAINST ALL SLOTS');
  console.log('================================================================');

  // Build the proposed list of slots for G11 and G12
  const proposedSlots = [];
  for (const board of ['fbise', 'sindh']) {
    for (const grade of ['11', '12']) {
      const slots = PROPOSED_G11_G12[board][grade];
      for (const slot of slots) {
        const pTimes = PERIOD_TIMES[slot.period];
        const teacherInfo = offeringTeacherMap[`${board}_${grade}_${slot.subject.toLowerCase()}`] || { teacherId: null, teacherName: null };
        proposedSlots.push({
          board,
          grade,
          period: slot.period,
          subject: slot.subject,
          day: slot.day,
          startTime: pTimes.start,
          endTime: pTimes.end,
          teacherId: teacherInfo.teacherId,
          teacherName: teacherInfo.teacherName,
        });
      }
    }
  }

  // Conflict detection:
  // 1. Proposed G11/G12 slot vs Existing Active Slot
  // 2. Proposed G11/G12 slot vs another Proposed G11/G12 slot
  const g11g12Conflicts = [];

  for (const prop of proposedSlots) {
    if (!prop.teacherId) continue; // Unassigned teachers cannot be double-booked yet

    // Compare with existing active slots
    for (const active of activeSlotsRes.rows) {
      if (
        active.teacher_id === prop.teacherId &&
        active.day_of_week === prop.day &&
        active.start_time === prop.startTime
      ) {
        g11g12Conflicts.push({
          teacher: prop.teacherName,
          day: DAY_NAMES[prop.day],
          period: prop.period,
          time: `${prop.startTime} - ${prop.endTime}`,
          proposedClass: `${prop.board.toUpperCase()} Grade ${prop.grade} (${prop.subject})`,
          conflictingWith: `EXISTING: ${active.board_id.toUpperCase()} Grade ${active.grade} (${active.subject_name})`,
        });
      }
    }
  }

  // Compare proposed against proposed
  for (let i = 0; i < proposedSlots.length; i++) {
    for (let j = i + 1; j < proposedSlots.length; j++) {
      const p1 = proposedSlots[i];
      const p2 = proposedSlots[j];
      if (
        p1.teacherId &&
        p2.teacherId &&
        p1.teacherId === p2.teacherId &&
        p1.day === p2.day &&
        p1.startTime === p2.startTime
      ) {
        g11g12Conflicts.push({
          teacher: p1.teacherName,
          day: DAY_NAMES[p1.day],
          period: p1.period,
          time: `${p1.startTime} - ${p1.endTime}`,
          proposedClass: `${p1.board.toUpperCase()} Grade ${p1.grade} (${p1.subject})`,
          conflictingWith: `PROPOSED: ${p2.board.toUpperCase()} Grade ${p2.grade} (${p2.subject})`,
        });
      }
    }
  }

  console.log(`\nTotal teacher conflicts involving proposed Grade 11/12 slots: ${g11g12Conflicts.length}`);
  console.table(g11g12Conflicts);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
