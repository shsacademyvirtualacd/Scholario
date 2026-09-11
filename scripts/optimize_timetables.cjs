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

async function solveAllDays() {
  await client.connect();

  const activeRes = await client.query(`
    SELECT cs.id, c.board_id, c.grade, cs.day_of_week, cs.start_time, cs.end_time, s.name as subject_name, t.full_name as teacher_name
    FROM public.class_slots cs
    JOIN public.classes c ON cs.class_id = c.id
    JOIN public.class_offerings co ON cs.offering_id = co.id
    JOIN public.subjects s ON co.subject_id = s.id
    LEFT JOIN public.teachers t ON co.teacher_id = t.id
  `);

  const TEACHER_MAP = {
    'Mathematics': 'Mr. Hashir',
    'Physics': 'Muhammad Hasnain Shoukat',
    'English': 'Mr. Husnain',
    'Chemistry': 'Ms. Khadija',
    'Islamiat': 'Ms. Falak',
    'Urdu': 'Mr. Subhan',
    'fbise_11_Biology': 'Ms. Khadija',
    'sindh_11_Biology': 'Mr. Subhan',
    'fbise_12_Biology': 'Mr. Subhan',
    'sindh_12_Biology': 'Mr. Subhan',
  };

  const getTeacher = (cohort, subject) => {
    if (subject === 'Biology') return TEACHER_MAP[`${cohort}_Biology`];
    return TEACHER_MAP[subject];
  };

  // Required subjects per cohort per day:
  // Note: For Sindh 11, Mathematics is ALREADY scheduled at 19:30 (P6) with Mr. Hashir every day!
  const DAILY_SUBJECTS = {
    0: { // Monday
      fbise_11: ['Chemistry', 'Mathematics', 'Physics', 'English'],
      sindh_11: ['Chemistry', 'Physics', 'English'], // Math at 19:30
      fbise_12: ['Biology', 'English', 'Physics', 'Mathematics'],
      sindh_12: ['Biology', 'English', 'Physics', 'Mathematics'],
    },
    1: { // Tuesday
      fbise_11: ['Biology', 'Physics', 'Urdu', 'Mathematics'],
      sindh_11: ['Biology', 'Physics', 'Urdu'], // Math at 19:30
      fbise_12: ['Islamiat', 'Chemistry', 'Mathematics', 'Urdu', 'Physics'],
      sindh_12: ['Chemistry', 'Mathematics', 'Urdu', 'Physics'],
    },
    2: { // Wednesday
      fbise_11: ['Islamiat', 'English', 'Mathematics', 'Physics'],
      sindh_11: ['Chemistry', 'English', 'Physics'], // Math at 19:30
      fbise_12: ['Biology', 'Physics', 'English', 'Mathematics'],
      sindh_12: ['Biology', 'Physics', 'English', 'Mathematics'],
    },
    3: { // Thursday
      fbise_11: ['Islamiat', 'Mathematics', 'Urdu', 'English'],
      sindh_11: ['Biology', 'Urdu', 'English'], // Math at 19:30
      fbise_12: ['Islamiat', 'Chemistry', 'Mathematics', 'Urdu', 'English'],
      sindh_12: ['Chemistry', 'Mathematics', 'Urdu', 'English'],
    },
    4: { // Friday
      fbise_11: ['Chemistry', 'Physics', 'English', 'Mathematics'],
      sindh_11: ['Chemistry', 'Physics', 'English'], // Math at 19:30
      fbise_12: ['Biology', 'English', 'Mathematics', 'Physics'],
      sindh_12: ['Biology', 'English', 'Mathematics', 'Physics'],
    },
  };

  // Allowed periods for each subject:
  const isPeriodAllowed = (cohort, subject, period, day) => {
    const s = subject.toLowerCase();
    // Rule 1: Phys, Math, Eng never in P1
    if (period === 'P1' && ['physics', 'mathematics', 'english'].includes(s)) return false;
    // Rule 2: Urdu never in P1 or P2
    if (['P1', 'P2'].includes(period) && s === 'urdu') return false;
    // Rule 3: Islamiat only for FBISE
    if (s === 'islamiat' && !cohort.startsWith('fbise')) return false;
    // Rule 4: Islamiat
    if (s === 'islamiat') {
      if (cohort === 'fbise_11' && (day === 2 || day === 3) && period === 'P1') return true;
      if (period === 'P0') return true;
      return false;
    }
    // Non-islamiat in P0: P0 is Islamiat only
    if (period === 'P0' && s !== 'islamiat') return false;

    return true;
  };

  const finalSchedule = [];

  for (let day = 0; day < 5; day++) {
    console.log(`\nSolving Day ${day} (${DAY_NAMES[day]})...`);

    // Get active busy teachers on this day: time -> Set of teachers
    const activeBusyAtTime = {};
    for (const p of Object.keys(PERIODS)) {
      activeBusyAtTime[PERIODS[p].start] = new Set();
    }
    for (const r of activeRes.rows) {
      if (r.day_of_week === day && r.teacher_name && activeBusyAtTime[r.start_time]) {
        activeBusyAtTime[r.start_time].add(r.teacher_name);
      }
    }

    const daySubjects = DAILY_SUBJECTS[day];
    const cohorts = ['fbise_11', 'sindh_11', 'fbise_12', 'sindh_12'];

    // Backtracking search for a conflict-free assignment on this day
    const availablePeriods = Object.keys(PERIODS); // P0, P1, P2, P3, P4, P5

    // Flatten requirements: list of { cohort, subject }
    const itemsToSchedule = [];
    for (const c of cohorts) {
      for (const subj of daySubjects[c]) {
        itemsToSchedule.push({ cohort: c, subject: subj, teacher: getTeacher(c, subj) });
      }
    }

    let solution = null;

    function backtrack(idx, currentAssignments, cohortOccupiedPeriods, teacherOccupiedPeriods) {
      if (idx === itemsToSchedule.length) {
        solution = [...currentAssignments];
        return true;
      }

      const item = itemsToSchedule[idx];
      const validPeriods = availablePeriods.filter(p => isPeriodAllowed(item.cohort, item.subject, p, day));

      // Try periods
      for (const p of validPeriods) {
        const timeStart = PERIODS[p].start;

        // Check if cohort already has a class in period p
        if (cohortOccupiedPeriods[item.cohort].has(p)) continue;

        // Check if teacher is busy with active slots at this time
        if (activeBusyAtTime[timeStart].has(item.teacher)) continue;

        // Check if teacher is busy with another scheduled class at this period
        if (teacherOccupiedPeriods[item.teacher].has(p)) continue;

        // Valid! Assign
        cohortOccupiedPeriods[item.cohort].add(p);
        teacherOccupiedPeriods[item.teacher].add(p);
        currentAssignments.push({ day, cohort: item.cohort, subject: item.subject, period: p, teacher: item.teacher, time: PERIODS[p] });

        if (backtrack(idx + 1, currentAssignments, cohortOccupiedPeriods, teacherOccupiedPeriods)) {
          return true;
        }

        // Backtrack
        currentAssignments.pop();
        cohortOccupiedPeriods[item.cohort].delete(p);
        teacherOccupiedPeriods[item.teacher].delete(p);
      }

      return false;
    }

    const cohortOccupied = {};
    for (const c of cohorts) cohortOccupied[c] = new Set();
    const teacherOccupied = {};
    const allTeachers = [...new Set(Object.values(TEACHER_MAP))];
    for (const t of allTeachers) teacherOccupied[t] = new Set();

    const success = backtrack(0, [], cohortOccupied, teacherOccupied);
    if (!success) {
      console.error(`FAILED to find conflict-free schedule for Day ${day} (${DAY_NAMES[day]}) with periods P0-P5!`);
    } else {
      console.log(`SUCCESS! Found conflict-free solution for ${DAY_NAMES[day]} with ${solution.length} classes.`);
      finalSchedule.push(...solution);
    }
  }

  console.log(`\n========================================`);
  console.log(`TOTAL SCHEDULED G11 & G12 SLOTS: ${finalSchedule.length}`);
  console.log(`========================================`);

  // Run full conflict check across all active + finalSchedule
  const masterSlots = [];
  for (const r of activeRes.rows) {
    if (r.day_of_week < 5 && r.teacher_name) {
      masterSlots.push({
        source: `[ACTIVE] ${r.board_id.toUpperCase()} G${r.grade} ${r.subject_name}`,
        teacher: r.teacher_name,
        cohort: `${r.board_id}_${r.grade}`,
        subject: r.subject_name,
        day: r.day_of_week,
        start: r.start_time,
      });
    }
  }
  for (const s of finalSchedule) {
    masterSlots.push({
      source: `[PROPOSED] ${s.cohort} ${s.subject}`,
      teacher: s.teacher,
      cohort: s.cohort,
      subject: s.subject,
      day: s.day,
      start: s.time.start,
    });
  }

  let conflictCount = 0;
  for (let i = 0; i < masterSlots.length; i++) {
    for (let j = i + 1; j < masterSlots.length; j++) {
      const a = masterSlots[i];
      const b = masterSlots[j];
      if (a.day === b.day && a.start === b.start) {
        if (a.teacher === b.teacher) {
          conflictCount++;
          console.error(`TEACHER CONFLICT: ${a.teacher} on ${DAY_NAMES[a.day]} at ${a.start} between ${a.source} and ${b.source}`);
        }
        if (a.cohort === b.cohort) {
          conflictCount++;
          console.error(`COHORT CONFLICT: ${a.cohort} on ${DAY_NAMES[a.day]} at ${a.start} between ${a.source} and ${b.source}`);
        }
      }
    }
  }

  console.log(`\nMASTER CONFLICT COUNT ACROSS ENTIRE PLATFORM (G9, G10, G11, G12): ${conflictCount}`);

  // Let's print out the full timetable in table format
  for (const cohort of ['fbise_11', 'sindh_11', 'fbise_12', 'sindh_12']) {
    console.log(`\n=======================================================`);
    console.log(`TIMETABLE FOR ${cohort.toUpperCase()}`);
    console.log(`=======================================================`);
    for (let d = 0; d < 5; d++) {
      const daySlots = finalSchedule.filter(s => s.cohort === cohort && s.day === d);
      daySlots.sort((a, b) => a.time.start.localeCompare(b.time.start));
      const slotsStr = daySlots.map(s => `${s.period} (${s.time.start.slice(0, 5)}): ${s.subject} [${s.teacher}]`).join(' | ');
      console.log(`${DAY_NAMES[d]}: ${slotsStr}`);
    }
  }

  await client.end();
}

solveAllDays().catch(console.error);
