const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Marcelmmm23155%40@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres'
});

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIOD_TIMES = {
  P0: { start: '16:30:00', end: '17:00:00' },
  P1: { start: '17:00:00', end: '17:30:00' },
  P2: { start: '17:30:00', end: '18:00:00' },
  P3: { start: '18:00:00', end: '18:30:00' },
  P4: { start: '18:30:00', end: '19:00:00' },
};

// Existing unadjusted proposed schedule for Grade 11 & 12
const USER_PROPOSED = {
  fbise: {
    '11': [
      { day: 0, period: 'P1', subject: 'Chemistry' },
      { day: 0, period: 'P2', subject: 'Mathematics' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'English' },
      { day: 1, period: 'P1', subject: 'Biology' },
      { day: 1, period: 'P2', subject: 'Physics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Mathematics' },
      { day: 2, period: 'P1', subject: 'Islamiat' },
      { day: 2, period: 'P2', subject: 'English' },
      { day: 2, period: 'P3', subject: 'Mathematics' },
      { day: 2, period: 'P4', subject: 'Physics' },
      { day: 3, period: 'P1', subject: 'Islamiat' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      { day: 4, period: 'P1', subject: 'Chemistry' },
      { day: 4, period: 'P2', subject: 'Physics' },
      { day: 4, period: 'P3', subject: 'English' },
      { day: 4, period: 'P4', subject: 'Mathematics' },
    ],
    '12': [
      { day: 0, period: 'P1', subject: 'Biology' },
      { day: 0, period: 'P2', subject: 'English' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'Mathematics' },
      { day: 1, period: 'P0', subject: 'Islamiat' },
      { day: 1, period: 'P1', subject: 'Chemistry' },
      { day: 1, period: 'P2', subject: 'Mathematics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Physics' },
      { day: 2, period: 'P1', subject: 'Biology' },
      { day: 2, period: 'P2', subject: 'Physics' },
      { day: 2, period: 'P3', subject: 'English' },
      { day: 2, period: 'P4', subject: 'Mathematics' },
      { day: 3, period: 'P0', subject: 'Islamiat' },
      { day: 3, period: 'P1', subject: 'Chemistry' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      { day: 4, period: 'P1', subject: 'Biology' },
      { day: 4, period: 'P2', subject: 'English' },
      { day: 4, period: 'P3', subject: 'Mathematics' },
      { day: 4, period: 'P4', subject: 'Physics' },
    ],
  },
  sindh: {
    '11': [
      { day: 0, period: 'P1', subject: 'Chemistry' },
      { day: 0, period: 'P2', subject: 'Mathematics' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'English' },
      { day: 1, period: 'P1', subject: 'Biology' },
      { day: 1, period: 'P2', subject: 'Physics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Mathematics' },
      { day: 2, period: 'P1', subject: 'Chemistry' },
      { day: 2, period: 'P2', subject: 'English' },
      { day: 2, period: 'P3', subject: 'Mathematics' },
      { day: 2, period: 'P4', subject: 'Physics' },
      { day: 3, period: 'P1', subject: 'Biology' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      { day: 4, period: 'P1', subject: 'Chemistry' },
      { day: 4, period: 'P2', subject: 'Physics' },
      { day: 4, period: 'P3', subject: 'English' },
      { day: 4, period: 'P4', subject: 'Mathematics' },
    ],
    '12': [
      { day: 0, period: 'P1', subject: 'Biology' },
      { day: 0, period: 'P2', subject: 'English' },
      { day: 0, period: 'P3', subject: 'Physics' },
      { day: 0, period: 'P4', subject: 'Mathematics' },
      { day: 1, period: 'P1', subject: 'Chemistry' },
      { day: 1, period: 'P2', subject: 'Mathematics' },
      { day: 1, period: 'P3', subject: 'Urdu' },
      { day: 1, period: 'P4', subject: 'Physics' },
      { day: 2, period: 'P1', subject: 'Biology' },
      { day: 2, period: 'P2', subject: 'Physics' },
      { day: 2, period: 'P3', subject: 'English' },
      { day: 2, period: 'P4', subject: 'Mathematics' },
      { day: 3, period: 'P1', subject: 'Chemistry' },
      { day: 3, period: 'P2', subject: 'Mathematics' },
      { day: 3, period: 'P3', subject: 'Urdu' },
      { day: 3, period: 'P4', subject: 'English' },
      { day: 4, period: 'P1', subject: 'Biology' },
      { day: 4, period: 'P2', subject: 'English' },
      { day: 4, period: 'P3', subject: 'Mathematics' },
      { day: 4, period: 'P4', subject: 'Physics' },
    ],
  },
};

async function solve() {
  await client.connect();

  // 1. Get real teachers currently assigned to offerings
  const offRes = await client.query(`
    SELECT c.board_id, c.grade, s.name as subject_name, co.teacher_id, t.full_name as teacher_name
    FROM public.class_offerings co
    JOIN public.classes c ON co.class_id = c.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
  `);

  const realTeacherMap = {};
  for (const r of offRes.rows) {
    realTeacherMap[`${r.board_id}_${r.grade}_${r.subject_name.toLowerCase()}`] = {
      teacher_id: r.teacher_id,
      teacher_name: r.teacher_name
    };
  }

  // 2. Get all currently active slots in DB (G9, G10, and Sindh 11 Math 19:30)
  const activeSlotsRes = await client.query(`
    SELECT cs.id, c.board_id, c.grade, cs.day_of_week, cs.start_time, cs.end_time, s.name as subject_name, co.teacher_id, t.full_name as teacher_name
    FROM public.class_slots cs
    JOIN public.classes c ON cs.class_id = c.id
    JOIN public.class_offerings co ON cs.offering_id = co.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
  `);

  console.log(`Loaded ${activeSlotsRes.rows.length} currently active slots.`);

  // 3. Analyze exact conflicts for the USER_PROPOSED Grade 11 & 12 schedules against real DB data:
  const directConflicts = [];

  for (const board of ['fbise', 'sindh']) {
    for (const grade of ['11', '12']) {
      for (const slot of USER_PROPOSED[board][grade]) {
        const time = PERIOD_TIMES[slot.period];
        const teacherInfo = realTeacherMap[`${board}_${grade}_${slot.subject.toLowerCase()}`];
        if (!teacherInfo || !teacherInfo.teacher_id) continue;

        // Check vs active slots in G9/G10/G11-math
        for (const active of activeSlotsRes.rows) {
          if (
            active.teacher_id === teacherInfo.teacher_id &&
            active.day_of_week === slot.day &&
            active.start_time === time.start
          ) {
            directConflicts.push({
              teacher: teacherInfo.teacher_name,
              day: DAY_NAMES[slot.day],
              period: slot.period,
              time: `${time.start} - ${time.end}`,
              grade11_12_class: `${board.toUpperCase()} Grade ${grade} - ${slot.subject}`,
              existing_active_class: `${active.board_id.toUpperCase()} Grade ${active.grade} - ${active.subject_name}`,
            });
          }
        }
      }
    }
  }

  // Also check G11 vs G12 proposed slots with real assigned teachers
  const allProposedWithTeachers = [];
  for (const board of ['fbise', 'sindh']) {
    for (const grade of ['11', '12']) {
      for (const slot of USER_PROPOSED[board][grade]) {
        const time = PERIOD_TIMES[slot.period];
        const teacherInfo = realTeacherMap[`${board}_${grade}_${slot.subject.toLowerCase()}`];
        if (teacherInfo && teacherInfo.teacher_id) {
          allProposedWithTeachers.push({
            board,
            grade,
            period: slot.period,
            subject: slot.subject,
            day: slot.day,
            time: time.start,
            endTime: time.end,
            teacherId: teacherInfo.teacher_id,
            teacherName: teacherInfo.teacher_name,
          });
        }
      }
    }
  }

  for (let i = 0; i < allProposedWithTeachers.length; i++) {
    for (let j = i + 1; j < allProposedWithTeachers.length; j++) {
      const a = allProposedWithTeachers[i];
      const b = allProposedWithTeachers[j];
      if (a.teacherId === b.teacherId && a.day === b.day && a.time === b.time) {
        directConflicts.push({
          teacher: a.teacherName,
          day: DAY_NAMES[a.day],
          period: a.period,
          time: `${a.time} - ${a.endTime}`,
          grade11_12_class: `${a.board.toUpperCase()} Grade ${a.grade} - ${a.subject}`,
          existing_active_class: `PROPOSED: ${b.board.toUpperCase()} Grade ${b.grade} - ${b.subject}`,
        });
      }
    }
  }

  console.log(`\nDIRECT CONFLICTS WITH REAL ASSIGNED TEACHERS IN DB (${directConflicts.length}):`);
  console.table(directConflicts);

  await client.end();
}

solve().catch(console.error);
