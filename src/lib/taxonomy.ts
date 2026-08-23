// ─────────────────────────────────────────────────────────────────────────────
// Scholario — Educational Boards & Class Taxonomy (Single Source of Truth)
// ─────────────────────────────────────────────────────────────────────────────
// ALL board/grade/stream/subject data lives here. No other file may hardcode this
// information. Import from this module whenever you need taxonomy data.
// ─────────────────────────────────────────────────────────────────────────────

export interface StreamDef {
  name: string;
  subjects: string[];
}

export interface GradeDef {
  grade: string;
  displayName: string;
  streams: StreamDef[];
  commonSubjects: string[];
  boardId?: string;
}

export interface BoardDef {
  id: 'fbise' | 'sindh';
  name: string;
  shortName: string;
  description: string;
}

export const BOARDS: BoardDef[] = [
  {
    id: 'fbise',
    name: 'Federal Board (FBISE)',
    shortName: 'FBISE',
    description: 'Federal Board of Intermediate & Secondary Education (Islamabad & National)',
  },
  {
    id: 'sindh',
    name: 'Sindh Board',
    shortName: 'Sindh Board',
    description: 'Sindh Secondary & Higher Secondary Education (Karachi & Provincial Boards)',
  },
];

export const BOARD = { id: 'fbise', name: 'FBISE' } as const;

export const FBISE_GRADES: GradeDef[] = [
  {
    grade: '9',
    displayName: '9th',
    boardId: 'fbise',
    commonSubjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Islamiat'],
    streams: [
      { name: 'Biology', subjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Biology', 'Islamiat'] },
      { name: 'Computer Science', subjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Computer Science', 'Islamiat'] },
    ],
  },
  {
    grade: '10',
    displayName: '10th',
    boardId: 'fbise',
    commonSubjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics'],
    streams: [
      { name: 'Biology', subjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Biology'] },
      { name: 'Computer Science', subjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Computer'] },
    ],
  },
  {
    grade: '11',
    displayName: '11th',
    boardId: 'fbise',
    commonSubjects: ['English', 'Urdu', 'Islamiat'],
    streams: [
      { name: 'Pre-Medical', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology', 'Islamiat'] },
      { name: 'Pre-Engineering', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Islamiat'] },
      { name: 'ICS', subjects: ['English', 'Urdu', 'Computer Science', 'Mathematics', 'Physics', 'Islamiat'] },
    ],
  },
  {
    grade: '12',
    displayName: '12th',
    boardId: 'fbise',
    commonSubjects: ['English', 'Urdu'],
    streams: [
      { name: 'Pre-Medical', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology'] },
      { name: 'Pre-Engineering', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics'] },
      { name: 'ICS', subjects: ['English', 'Urdu', 'Computer Science', 'Mathematics', 'Physics'] },
    ],
  },
];

export const SINDH_GRADES: GradeDef[] = [
  {
    grade: '9',
    displayName: '9th',
    boardId: 'sindh',
    commonSubjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Islamiat'],
    streams: [
      { name: 'Biology', subjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Biology', 'Islamiat'] },
      { name: 'Computer Science', subjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Computer Science', 'Islamiat'] },
    ],
  },
  {
    grade: '10',
    displayName: '10th',
    boardId: 'sindh',
    commonSubjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Pakistan Studies'],
    streams: [
      { name: 'Biology', subjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Biology', 'Pakistan Studies'] },
      { name: 'Computer Science', subjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Computer Science', 'Pakistan Studies'] },
    ],
  },
  {
    grade: '11',
    displayName: '11th',
    boardId: 'sindh',
    commonSubjects: ['English', 'Urdu', 'Islamiat'],
    streams: [
      { name: 'Pre-Medical', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology', 'Islamiat'] },
      { name: 'Pre-Engineering', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Islamiat'] },
      { name: 'ICS', subjects: ['English', 'Urdu', 'Computer Science', 'Mathematics', 'Physics', 'Islamiat'] },
    ],
  },
  {
    grade: '12',
    displayName: '12th',
    boardId: 'sindh',
    commonSubjects: ['English', 'Urdu', 'Pakistan Studies'],
    streams: [
      { name: 'Pre-Medical', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology', 'Pakistan Studies'] },
      { name: 'Pre-Engineering', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Pakistan Studies'] },
      { name: 'ICS', subjects: ['English', 'Urdu', 'Computer Science', 'Mathematics', 'Physics', 'Pakistan Studies'] },
    ],
  },
];

// GRADES default alias (FBISE for backward compatibility)
export const GRADES: GradeDef[] = FBISE_GRADES;

/** Get grades for a specific board */
export function getGradesForBoard(boardId: string): GradeDef[] {
  if (boardId === 'sindh') return SINDH_GRADES;
  return FBISE_GRADES;
}

/** Get board definition by id */
export function getBoardDef(boardId?: string | null): BoardDef {
  return BOARDS.find((b) => b.id === boardId) || BOARDS[0];
}

/** Default monthly tuition price by grade (aligned with database fee_configs) */
export function getDefaultPrice(grade: string): number {
  return ['11', '12'].includes(grade) ? 4000 : 3000;
}

/** All unique subject names used across the entire taxonomy */
export function getAllSubjectNames(): string[] {
  const set = new Set<string>();
  const allGrades = [...FBISE_GRADES, ...SINDH_GRADES];
  for (const g of allGrades) {
    for (const s of g.streams) {
      for (const sub of s.subjects) {
        set.add(sub);
      }
    }
  }
  return Array.from(set).sort();
}

/** Get streams available for a given grade and optional board */
export function getStreamsForGrade(grade: string, boardId?: string): StreamDef[] {
  const gradeList = boardId ? getGradesForBoard(boardId) : GRADES;
  return gradeList.find((g) => g.grade === grade)?.streams ?? [];
}

/**
 * @deprecated Import getSubjectsForStream from 'src/lib/db' instead.
 * That version reads authoritative subject names directly from the DB via
 * cachedTaxonomy (stream_subjects → subjects join), eliminating static-string
 * drift. This stub is kept only so that getEnrolledSubjectsForStudent (which
 * calls it internally) continues to build until it is separately migrated.
 */
export function getSubjectsForStream(grade: string, streamName: string): string[] {
  if (typeof console !== 'undefined') {
    console.warn(
      '[taxonomy] getSubjectsForStream called from taxonomy.ts (static shadow data). ' +
      'Import from db.ts for the DB-backed version.'
    );
  }
  const g = GRADES.find((gr) => gr.grade === grade);
  if (!g) return [];
  if (!streamName) return g.commonSubjects || [];

  const norm = streamName.trim().toLowerCase();
  const s = g.streams.find(
    (st) =>
      st.name.toLowerCase() === norm ||
      norm.includes(st.name.toLowerCase()) ||
      st.name.toLowerCase().includes(norm)
  );
  if (s) return s.subjects;

  // Fallback to first stream or common subjects if stream not recognized
  return g.streams[0]?.subjects ?? g.commonSubjects ?? [];
}

/** Derive exact enrolled taxonomy subjects for a student profile and enrollments */
export function getEnrolledSubjectsForStudent(profile: any, enrollments?: any[]): string[] {
  let grade = '10';
  let streamName = '';

  if (enrollments && enrollments.length > 0) {
    const off = enrollments[0].offering;
    if (off?.class?.grade || off?.grade) {
      grade = off?.class?.grade || off?.grade;
    }
    // Check if enrollment or profile specifies stream
    const foundStream = enrollments.find((e) => e.stream)?.stream || off?.stream || off?.class?.stream;
    if (foundStream) streamName = foundStream;
  }

  if (profile) {
    if ((!grade || grade === '10') && (profile.class?.grade || profile.grade)) {
      grade = profile.class?.grade || profile.grade;
    }
    if (!streamName) {
      streamName = profile.stream_obj?.name || profile.stream || '';
    }
  }

  const subjects = getSubjectsForStream(grade, streamName);
  return Array.from(new Set(subjects)).sort();
}

/** Resolves the human-readable board name for a student (e.g. 'Federal Board (FBISE)' or 'Sindh Board') */
export function getStudentBoardLabel(
  student: {
    board_id?: string | null;
    board?: { id?: string; name?: string } | string | null;
    class?: { board_id?: string; grade?: string; display_name?: string; board?: { id?: string; name?: string } | string } | null;
    id?: string;
  },
  enrollments?: Array<{ student_id: string; offering_id: string }>,
  offerings?: Array<{ id: string; grade?: string; board?: string; class_id?: string; class?: { board_id?: string; board?: { id?: string; name?: string } | string } }>
): string {
  // 1. Check direct board_id or board on student profile
  const rawBoardId =
    student.board_id ||
    (typeof student.board === 'string' ? student.board : student.board?.id) ||
    student.class?.board_id ||
    (typeof student.class?.board === 'string' ? student.class?.board : (student.class?.board as { id?: string })?.id);

  if (rawBoardId) {
    const bIdNorm = String(rawBoardId).trim().toLowerCase();
    if (bIdNorm === 'sindh') return 'Sindh Board';
    if (bIdNorm === 'fbise') return 'Federal Board (FBISE)';
    const bDef = BOARDS.find((b) => b.id.toLowerCase() === bIdNorm);
    if (bDef) return bDef.name;
  }

  // 2. Check joined board name on student class or profile
  if (student.class?.board && typeof student.class.board === 'object' && student.class.board.name) {
    return student.class.board.name;
  }
  if (student.board && typeof student.board === 'object' && student.board.name) {
    return student.board.name;
  }

  // 3. Check enrollments and corresponding class offerings
  if (enrollments && offerings && student.id) {
    const studentEnrollments = enrollments.filter((e) => e.student_id === student.id);
    for (const en of studentEnrollments) {
      const off = offerings.find((o) => o.id === en.offering_id);
      if (off) {
        const offBoard =
          off.board ||
          off.class?.board_id ||
          (typeof off.class?.board === 'string' ? off.class.board : (off.class?.board as { id?: string })?.id);
        if (offBoard) {
          const offNorm = String(offBoard).trim().toLowerCase();
          if (offNorm === 'sindh') return 'Sindh Board';
          if (offNorm === 'fbise') return 'Federal Board (FBISE)';
          const bDef = BOARDS.find((b) => b.id.toLowerCase() === offNorm);
          if (bDef) return bDef.name;
        }
        if (off.class?.board && typeof off.class.board === 'object' && off.class.board.name) {
          return off.class.board.name;
        }
      }
    }
  }

  // Default fallback if no board specified
  return 'Federal Board (FBISE)';
}

/** Resolves the grade label for a student (e.g. 'Grade 9', 'Grade 10') */
export function getStudentGradeLabel(
  student: {
    grade?: string | null;
    class?: { grade?: string; display_name?: string } | null;
    id?: string;
  },
  enrollments?: Array<{ student_id: string; offering_id: string }>,
  offerings?: Array<{ id: string; grade?: string }>
): string {
  if (student.class?.grade) {
    return `Grade ${student.class.grade}`;
  }
  if (student.grade) {
    return `Grade ${student.grade}`;
  }
  if (student.class?.display_name) {
    return student.class.display_name.startsWith('Grade')
      ? student.class.display_name
      : `Grade ${student.class.display_name}`;
  }

  if (enrollments && offerings && student.id) {
    const studentEnrollments = enrollments.filter((e) => e.student_id === student.id);
    for (const en of studentEnrollments) {
      const off = offerings.find((o) => o.id === en.offering_id);
      if (off?.grade) {
        return `Grade ${off.grade}`;
      }
    }
  }

  return 'General';
}

/** Resolves the formatted stream label for a student */
export function getStudentStreamLabel(student: {
  stream?: string | null;
  stream_obj?: { name?: string } | null;
}): string {
  const raw = student.stream_obj?.name || student.stream;
  if (!raw) return 'General';

  const lower = raw.trim().toLowerCase();
  if (lower === 'ics') return 'ICS';
  if (lower === 'pre-medical' || lower === 'pre medical') return 'Pre-Medical';
  if (lower === 'pre-engineering' || lower === 'pre engineering') return 'Pre-Engineering';
  if (lower === 'computer science' || lower === 'computer-science') return 'Computer Science';
  if (lower === 'biology') return 'Biology';

  return raw
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

