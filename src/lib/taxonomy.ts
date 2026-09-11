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

export type BoardId = 'fbise' | 'sindh' | 'ielts' | 'olevel' | 'alevel' | 'kpk' | 'punjab';

export interface BoardDef {
  id: BoardId;
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
    id: 'punjab',
    name: 'Punjab Board (BISE Lahore & Provincial)',
    shortName: 'Punjab Board',
    description: 'Punjab Secondary & Intermediate Boards (BISE Lahore, Rawalpindi, Faisalabad, Multan, Gujranwala, etc.)',
  },
  {
    id: 'sindh',
    name: 'Sindh Board',
    shortName: 'Sindh Board',
    description: 'Sindh Secondary & Higher Secondary Education (Karachi & Provincial Boards)',
  },
  {
    id: 'kpk',
    name: 'KPK Board (BISE Peshawar & Provincial)',
    shortName: 'KPK Board',
    description: 'Khyber Pakhtunkhwa Boards (BISE Peshawar, Swat, Abbottabad, Mardan, etc.)',
  },
  {
    id: 'olevel',
    name: 'O Levels (Cambridge / Edexcel)',
    shortName: 'O Levels',
    description: 'Cambridge & Pearson Edexcel GCE Ordinary Level (Grades O1, O2, O3)',
  },
  {
    id: 'alevel',
    name: 'A Levels (Cambridge / Edexcel)',
    shortName: 'A Levels',
    description: 'Cambridge & Pearson Edexcel GCE Advanced Level (Grades AS/A1 and A2)',
  },
  {
    id: 'ielts',
    name: 'IELTS Preparation',
    shortName: 'IELTS',
    description: 'Complete 4-skill preparation covering Listening, Reading, Writing, and Speaking.',
  },
];

export const BOARD = { id: 'fbise', name: 'FBISE' } as const;

export const FBISE_GRADES: GradeDef[] = [
  {
    grade: '9',
    displayName: '9th',
    boardId: 'fbise',
    commonSubjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics'],
    streams: [
      { name: 'Biology', subjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Biology'] },
      { name: 'Computer Science', subjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Computer Science'] },
    ],
  },
  {
    grade: '10',
    displayName: '10th',
    boardId: 'fbise',
    commonSubjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Pakistan Studies'],
    streams: [
      { name: 'Biology', subjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Biology', 'Pakistan Studies'] },
      { name: 'Computer Science', subjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Computer Science', 'Pakistan Studies'] },
    ],
  },
  {
    grade: '11',
    displayName: '11th',
    boardId: 'fbise',
    commonSubjects: ['English', 'Urdu'],
    streams: [
      { name: 'Pre-Medical', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology'] },
      { name: 'Pre-Engineering', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics'] },
      { name: 'ICS', subjects: ['English', 'Urdu', 'Computer Science', 'Mathematics', 'Physics'] },
    ],
  },
  {
    grade: '12',
    displayName: '12th',
    boardId: 'fbise',
    commonSubjects: ['English', 'Urdu', 'Pakistan Studies'],
    streams: [
      { name: 'Pre-Medical', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology', 'Pakistan Studies'] },
      { name: 'Pre-Engineering', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Pakistan Studies'] },
      { name: 'ICS', subjects: ['English', 'Urdu', 'Computer Science', 'Mathematics', 'Physics', 'Pakistan Studies'] },
    ],
  },
];

export const SINDH_GRADES: GradeDef[] = [
  {
    grade: '9',
    displayName: '9th',
    boardId: 'sindh',
    commonSubjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics'],
    streams: [
      { name: 'Biology', subjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Biology'] },
      { name: 'Computer Science', subjects: ['English', 'Urdu', 'Mathematics', 'Chemistry', 'Physics', 'Computer Science'] },
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
    commonSubjects: ['English', 'Urdu'],
    streams: [
      { name: 'Pre-Medical', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology'] },
      { name: 'Pre-Engineering', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics'] },
      { name: 'ICS', subjects: ['English', 'Urdu', 'Computer Science', 'Mathematics', 'Physics'] },
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

export const IELTS_GRADES: GradeDef[] = [
  {
    grade: 'IELTS',
    displayName: 'IELTS Preparation',
    boardId: 'ielts',
    commonSubjects: [
      'IELTS Reading (Academic)',
      'IELTS Reading (GT)',
      'Grammar',
      'Comprehension of Passages',
      'IELTS Listening',
      'IELTS Speaking',
      'IELTS Writing (Academic)',
      'IELTS Writing (GT)',
    ],
    streams: [
      {
        name: 'Academic',
        subjects: [
          'IELTS Reading (Academic)',
          'IELTS Listening',
          'IELTS Writing (Academic)',
          'IELTS Speaking',
          'Grammar',
          'Comprehension of Passages',
        ],
      },
      {
        name: 'General Training',
        subjects: [
          'IELTS Reading (GT)',
          'IELTS Listening',
          'IELTS Writing (GT)',
          'IELTS Speaking',
          'Grammar',
          'Comprehension of Passages',
        ],
      },
    ],
  },
];

export const OLEVEL_GRADES: GradeDef[] = [
  {
    grade: 'O1',
    displayName: 'O1 (1st Year)',
    boardId: 'olevel',
    commonSubjects: ['English Language', 'Mathematics (Syllabus D)', 'Urdu', 'Islamiyat', 'Pakistan Studies'],
    streams: [
      {
        name: 'Science (Pre-Medical)',
        subjects: ['English Language', 'Mathematics (Syllabus D)', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'Physics', 'Chemistry', 'Biology'],
      },
      {
        name: 'Science (Pre-Engineering)',
        subjects: ['English Language', 'Mathematics (Syllabus D)', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'Physics', 'Chemistry', 'Computer Science'],
      },
      {
        name: 'Commerce / Business',
        subjects: ['English Language', 'Mathematics (Syllabus D)', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'Principles of Accounts', 'Economics', 'Business Studies', 'Commerce'],
      },
      {
        name: 'Humanities / General',
        subjects: ['English Language', 'Mathematics', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'World History', 'Environmental Management', 'Sociology', 'Literature in English'],
      },
    ],
  },
  {
    grade: 'O2',
    displayName: 'O2 (2nd Year)',
    boardId: 'olevel',
    commonSubjects: ['English Language', 'Mathematics (Syllabus D)', 'Urdu', 'Islamiyat', 'Pakistan Studies'],
    streams: [
      {
        name: 'Science (Pre-Medical)',
        subjects: ['English Language', 'Mathematics (Syllabus D)', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'Physics', 'Chemistry', 'Biology'],
      },
      {
        name: 'Science (Pre-Engineering)',
        subjects: ['English Language', 'Mathematics (Syllabus D)', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'Physics', 'Chemistry', 'Computer Science'],
      },
      {
        name: 'Commerce / Business',
        subjects: ['English Language', 'Mathematics (Syllabus D)', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'Principles of Accounts', 'Economics', 'Business Studies', 'Commerce'],
      },
      {
        name: 'Humanities / General',
        subjects: ['English Language', 'Mathematics', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'World History', 'Environmental Management', 'Sociology', 'Literature in English'],
      },
    ],
  },
  {
    grade: 'O3',
    displayName: 'O3 (Final Year)',
    boardId: 'olevel',
    commonSubjects: ['English Language', 'Mathematics (Syllabus D)', 'Urdu', 'Islamiyat', 'Pakistan Studies'],
    streams: [
      {
        name: 'Science (Pre-Medical)',
        subjects: ['English Language', 'Mathematics (Syllabus D)', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'Physics', 'Chemistry', 'Biology'],
      },
      {
        name: 'Science (Pre-Engineering)',
        subjects: ['English Language', 'Mathematics (Syllabus D)', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'Physics', 'Chemistry', 'Computer Science'],
      },
      {
        name: 'Commerce / Business',
        subjects: ['English Language', 'Mathematics (Syllabus D)', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'Principles of Accounts', 'Economics', 'Business Studies', 'Commerce'],
      },
      {
        name: 'Humanities / General',
        subjects: ['English Language', 'Mathematics', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'World History', 'Environmental Management', 'Sociology', 'Literature in English'],
      },
    ],
  },
];

export const ALEVEL_GRADES: GradeDef[] = [
  {
    grade: 'A1',
    displayName: 'AS / A1 (1st Year)',
    boardId: 'alevel',
    commonSubjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics', 'Business', 'Accounting'],
    streams: [
      {
        name: 'Pre-Medical',
        subjects: ['Biology', 'Chemistry', 'Physics', 'Mathematics'],
      },
      {
        name: 'Pre-Engineering',
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'Further Mathematics'],
      },
      {
        name: 'Computer Science / Tech',
        subjects: ['Mathematics', 'Computer Science', 'Physics', 'Further Mathematics'],
      },
      {
        name: 'Business / Commerce',
        subjects: ['Accounting', 'Economics', 'Business', 'Mathematics'],
      },
      {
        name: 'Humanities / Social Sciences',
        subjects: ['Law', 'Psychology', 'Sociology', 'History', 'English Literature'],
      },
      {
        name: 'General / Custom',
        subjects: ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'Computer Science', 'Accounting', 'Economics', 'Business', 'Further Mathematics', 'Law', 'Psychology', 'Sociology', 'History', 'English Literature'],
      },
    ],
  },
  {
    grade: 'A2',
    displayName: 'A2 (Final Year)',
    boardId: 'alevel',
    commonSubjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics', 'Business', 'Accounting'],
    streams: [
      {
        name: 'Pre-Medical',
        subjects: ['Biology', 'Chemistry', 'Physics', 'Mathematics'],
      },
      {
        name: 'Pre-Engineering',
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'Further Mathematics'],
      },
      {
        name: 'Computer Science / Tech',
        subjects: ['Mathematics', 'Computer Science', 'Physics', 'Further Mathematics'],
      },
      {
        name: 'Business / Commerce',
        subjects: ['Accounting', 'Economics', 'Business', 'Mathematics'],
      },
      {
        name: 'Humanities / Social Sciences',
        subjects: ['Law', 'Psychology', 'Sociology', 'History', 'English Literature'],
      },
      {
        name: 'General / Custom',
        subjects: ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'Computer Science', 'Accounting', 'Economics', 'Business', 'Further Mathematics', 'Law', 'Psychology', 'Sociology', 'History', 'English Literature'],
      },
    ],
  },
];

export const KPK_GRADES: GradeDef[] = [
  {
    grade: '9',
    displayName: '9th (SSC-I)',
    boardId: 'kpk',
    commonSubjects: ['English', 'Urdu', 'Islamiyat', 'Tarjuma-tul-Quran'],
    streams: [
      {
        name: 'Science (Biology)',
        subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Science (Computer Science)',
        subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'General / Humanities',
        subjects: ['English', 'Urdu', 'General Mathematics', 'General Science', 'Islamiyat', 'Tarjuma-tul-Quran', 'Civics'],
      },
    ],
  },
  {
    grade: '10',
    displayName: '10th (SSC-II)',
    boardId: 'kpk',
    commonSubjects: ['English', 'Urdu', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran'],
    streams: [
      {
        name: 'Science (Biology)',
        subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Science (Computer Science)',
        subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'General / Humanities',
        subjects: ['English', 'Urdu', 'General Mathematics', 'General Science', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran', 'Civics'],
      },
    ],
  },
  {
    grade: '11',
    displayName: '11th (HSSC-I)',
    boardId: 'kpk',
    commonSubjects: ['English', 'Urdu', 'Islamiyat', 'Tarjuma-tul-Quran'],
    streams: [
      {
        name: 'Pre-Medical',
        subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Pre-Engineering',
        subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Computer Science (ICS)',
        subjects: ['English', 'Urdu', 'Physics', 'Computer Science', 'Mathematics', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'General Science',
        subjects: ['English', 'Urdu', 'Mathematics', 'Statistics', 'Economics', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Humanities',
        subjects: ['English', 'Urdu', 'Civics', 'History of Pakistan', 'Economics', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
    ],
  },
  {
    grade: '12',
    displayName: '12th (HSSC-II)',
    boardId: 'kpk',
    commonSubjects: ['English', 'Urdu', 'Pakistan Studies', 'Tarjuma-tul-Quran'],
    streams: [
      {
        name: 'Pre-Medical',
        subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology', 'Pakistan Studies', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Pre-Engineering',
        subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Pakistan Studies', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Computer Science (ICS)',
        subjects: ['English', 'Urdu', 'Physics', 'Computer Science', 'Mathematics', 'Pakistan Studies', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'General Science',
        subjects: ['English', 'Urdu', 'Mathematics', 'Statistics', 'Economics', 'Pakistan Studies', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Humanities',
        subjects: ['English', 'Urdu', 'Civics', 'History of Pakistan', 'Economics', 'Pakistan Studies', 'Tarjuma-tul-Quran'],
      },
    ],
  },
];

export const PUNJAB_GRADES: GradeDef[] = [
  {
    grade: '9',
    displayName: '9th (Matric)',
    boardId: 'punjab',
    commonSubjects: ['English', 'Urdu', 'Islamiyat', 'Tarjuma-tul-Quran', 'Mathematics'],
    streams: [
      {
        name: 'Science (Biology)',
        subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Science (Computer Science)',
        subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'General / Arts',
        subjects: ['English', 'Urdu', 'General Mathematics', 'General Science', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
    ],
  },
  {
    grade: '10',
    displayName: '10th (Matric)',
    boardId: 'punjab',
    commonSubjects: ['English', 'Urdu', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran', 'Mathematics'],
    streams: [
      {
        name: 'Science (Biology)',
        subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Science (Computer Science)',
        subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'General / Arts',
        subjects: ['English', 'Urdu', 'General Mathematics', 'General Science', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
    ],
  },
  {
    grade: '11',
    displayName: '11th (Inter)',
    boardId: 'punjab',
    commonSubjects: ['English', 'Urdu', 'Islamiyat', 'Tarjuma-tul-Quran'],
    streams: [
      {
        name: 'Pre-Medical',
        subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Pre-Engineering',
        subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Computer Science (ICS)',
        subjects: ['English', 'Urdu', 'Physics', 'Computer Science', 'Mathematics', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'General Science',
        subjects: ['English', 'Urdu', 'Mathematics', 'Statistics', 'Economics', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Commerce (I.Com)',
        subjects: ['English', 'Urdu', 'Principles of Accounting', 'Principles of Economics', 'Principles of Commerce', 'Business Mathematics', 'Islamiyat', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Humanities / Arts',
        subjects: ['English', 'Urdu', 'Islamiyat', 'Tarjuma-tul-Quran', 'Civics', 'Education', 'History of Pakistan'],
      },
    ],
  },
  {
    grade: '12',
    displayName: '12th (Inter)',
    boardId: 'punjab',
    commonSubjects: ['English', 'Urdu', 'Pakistan Studies', 'Tarjuma-tul-Quran'],
    streams: [
      {
        name: 'Pre-Medical',
        subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology', 'Pakistan Studies', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Pre-Engineering',
        subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Pakistan Studies', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Computer Science (ICS)',
        subjects: ['English', 'Urdu', 'Physics', 'Computer Science', 'Mathematics', 'Pakistan Studies', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'General Science',
        subjects: ['English', 'Urdu', 'Mathematics', 'Statistics', 'Economics', 'Pakistan Studies', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Commerce (I.Com)',
        subjects: ['English', 'Urdu', 'Principles of Accounting', 'Commercial Geography', 'Banking', 'Business Statistics', 'Pakistan Studies', 'Tarjuma-tul-Quran'],
      },
      {
        name: 'Humanities / Arts',
        subjects: ['English', 'Urdu', 'Pakistan Studies', 'Tarjuma-tul-Quran', 'Civics', 'Education', 'History of Pakistan'],
      },
    ],
  },
];

// GRADES default alias (FBISE for backward compatibility)
export const GRADES: GradeDef[] = FBISE_GRADES;

/** Get grades for a specific board */
export function getGradesForBoard(boardId: string): GradeDef[] {
  const norm = (boardId || '').toLowerCase();
  if (norm === 'punjab') return PUNJAB_GRADES;
  if (norm === 'sindh') return SINDH_GRADES;
  if (norm === 'ielts') return IELTS_GRADES;
  if (norm === 'olevel') return OLEVEL_GRADES;
  if (norm === 'alevel') return ALEVEL_GRADES;
  if (norm === 'kpk') return KPK_GRADES;
  return FBISE_GRADES;
}

/** Get board definition by id */
export function getBoardDef(boardId?: string | null): BoardDef {
  return BOARDS.find((b) => b.id === boardId) || BOARDS[0];
}

/** Default monthly/term tuition price by grade and stream (aligned with database fee_configs) */
export function getDefaultPrice(grade: string, boardId?: string, streamName?: string): number {
  const normBoard = (boardId || '').toLowerCase();
  if (normBoard === 'alevel') {
    return 6500;
  }
  if (normBoard === 'olevel') {
    return 5000;
  }
  if (normBoard === 'punjab' || normBoard === 'kpk') {
    return ['11', '12'].includes(grade) ? 4000 : 3000;
  }
  const isIelts =
    normBoard === 'ielts' ||
    grade === 'IELTS' ||
    grade === 'ielts' ||
    (streamName && streamName.toLowerCase().includes('ielts'));

  if (isIelts) {
    if (
      (streamName && (streamName.toLowerCase().includes('general') || streamName.toLowerCase().includes('gt'))) ||
      grade === '12'
    ) {
      return 3000;
    }
    return 2500;
  }
  return ['11', '12'].includes(grade) ? 4000 : 3000;
}

/** All unique subject names used across the entire taxonomy */
export function getAllSubjectNames(): string[] {
  const set = new Set<string>();
  const allGrades = [...FBISE_GRADES, ...PUNJAB_GRADES, ...SINDH_GRADES, ...KPK_GRADES, ...OLEVEL_GRADES, ...ALEVEL_GRADES, ...IELTS_GRADES];
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
  let rawGrade = String(grade || '').trim();
  let rawBoard = String(boardId || '').trim();

  // Defensive swap if caller passes (boardId, grade) instead of (grade, boardId)
  const knownBoards = ['fbise', 'punjab', 'sindh', 'ielts', 'olevel', 'alevel', 'kpk'];
  if (
    rawGrade &&
    knownBoards.some((b) => rawGrade.toLowerCase().includes(b)) &&
    rawBoard &&
    !knownBoards.some((b) => rawBoard.toLowerCase().includes(b))
  ) {
    const tmp = rawGrade;
    rawGrade = rawBoard;
    rawBoard = tmp;
  }

  const gradeList = rawBoard ? getGradesForBoard(rawBoard) : FBISE_GRADES;

  // Clean grade string: e.g. "Grade 9" -> "9", "9th" -> "9", "Class 9" -> "9", "Grade 10" -> "10"
  const cleanGrade = rawGrade.replace(/^(grade|class)\s*/i, '').replace(/th$/i, '').trim().toLowerCase();

  const found = gradeList.find((g) => {
    const gGradeStr = String(g.grade).toLowerCase();
    const gNameStr = (g.displayName || '').toLowerCase();
    return (
      gGradeStr === cleanGrade ||
      gGradeStr === rawGrade.toLowerCase() ||
      gNameStr === rawGrade.toLowerCase() ||
      (cleanGrade.includes('ielts') && gGradeStr === 'ielts') ||
      (rawGrade.toLowerCase().includes('ielts') && gGradeStr === 'ielts') ||
      (cleanGrade === 'o1' && gGradeStr === 'o1') ||
      (cleanGrade === 'o2' && gGradeStr === 'o2') ||
      (cleanGrade === 'o3' && gGradeStr === 'o3') ||
      (cleanGrade === 'a1' && gGradeStr === 'a1') ||
      (cleanGrade === 'a2' && gGradeStr === 'a2') ||
      (cleanGrade === 'as' && gGradeStr === 'a1')
    );
  });

  if (found && found.streams && found.streams.length > 0) {
    return found.streams;
  }

  // Fallback to first grade's streams if grade is not matched, ensuring availableStreams is NEVER empty for valid boards
  return gradeList[0]?.streams ?? [];
}

/**
 * @deprecated Import getSubjectsForStream from 'src/lib/db' instead.
 * That version reads authoritative subject names directly from the DB via
 * cachedTaxonomy (stream_subjects → subjects join), eliminating static-string
 * drift. This stub is kept only so that getEnrolledSubjectsForStudent (which
 * calls it internally) continues to build until it is separately migrated.
 */
export function getSubjectsForStream(grade: string, streamName: string, boardId?: string): string[] {
  const normBoard = (boardId || '').trim().toLowerCase();
  const rawGrade = String(grade || '').trim();
  const cleanGrade = rawGrade.replace(/^(grade|class)\s*/i, '').replace(/th$/i, '').trim().toLowerCase();

  const isIelts =
    normBoard === 'ielts' ||
    cleanGrade === 'ielts' ||
    streamName?.toLowerCase().includes('ielts') ||
    ((streamName?.toLowerCase() === 'academic' || streamName?.toLowerCase() === 'general training') && (!normBoard || normBoard === 'ielts'));

  if (isIelts) {
    const isGt =
      streamName?.toLowerCase().includes('general') ||
      streamName?.toLowerCase().includes('gt');
    if (isGt) {
      return [
        'IELTS Listening',
        'IELTS Reading (GT)',
        'IELTS Writing (GT)',
        'IELTS Reading (Academic)',
        'IELTS Writing (Academic)',
        'IELTS Speaking',
      ];
    }
    return [
      'IELTS Listening',
      'IELTS Reading (Academic)',
      'IELTS Writing (Academic)',
      'IELTS Speaking',
    ];
  }

  const gradesList = getGradesForBoard(normBoard);
  const g =
    gradesList.find((gr) => gr.grade.toLowerCase() === cleanGrade || gr.grade.toLowerCase() === rawGrade.toLowerCase()) ||
    GRADES.find((gr) => gr.grade.toLowerCase() === cleanGrade || gr.grade.toLowerCase() === rawGrade.toLowerCase()) ||
    gradesList[0];

  if (!g) return ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'];
  if (!streamName) return g.commonSubjects || [];

  const norm = streamName.trim().toLowerCase();
  const s = g.streams.find(
    (st) =>
      st.name.toLowerCase() === norm ||
      norm.includes(st.name.toLowerCase()) ||
      st.name.toLowerCase().includes(norm)
  );
  if (s && s.subjects && s.subjects.length > 0) return s.subjects;

  // Fallback to first stream or common subjects if stream not recognized
  return g.streams[0]?.subjects ?? g.commonSubjects ?? ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'];
}

/** Derive exact enrolled taxonomy subjects for a student profile and enrollments */
export function getEnrolledSubjectsForStudent(profile: any, enrollments?: any[]): string[] {
  // 1. If profile explicitly has custom subjects enrolled (e.g. 1, 2, or 3 subjects), prioritize them
  if (profile?.plan_type === 'custom' && Array.isArray(profile?.subjects) && profile.subjects.length > 0) {
    return Array.from(new Set(profile.subjects as string[])).sort();
  }

  // Also check local student subject plans cache for instant reactivity
  if (profile?.id && typeof window !== 'undefined') {
    try {
      const cachedPlans = localStorage.getItem('scholario_student_subject_plans');
      if (cachedPlans) {
        const parsed = JSON.parse(cachedPlans);
        const stPlan = parsed[profile.id];
        if (stPlan?.plan_type === 'custom' && Array.isArray(stPlan.subjects) && stPlan.subjects.length > 0) {
          return Array.from(new Set(stPlan.subjects as string[])).sort();
        }
      }
    } catch {
      // ignore
    }
  }

  // If enrollments are provided and student is on a custom plan, derive from offerings
  if (enrollments && enrollments.length > 0 && profile?.plan_type === 'custom') {
    const enrolledNames = enrollments
      .map((e) => e.offering?.subject_name || e.offering?.subject?.name || e.subject)
      .filter(Boolean);
    if (enrolledNames.length > 0) {
      return Array.from(new Set(enrolledNames)).sort();
    }
  }

  let grade = '10';
  let streamName = '';
  let boardId = '';

  if (profile) {
    boardId =
      profile.board_id ||
      (typeof profile.board === 'string' ? profile.board : profile.board?.id) ||
      profile.class?.board_id ||
      (typeof profile.class?.board === 'string' ? profile.class.board : profile.class?.board?.id) ||
      '';
    if (profile.class?.grade || profile.grade) {
      grade = profile.class?.grade || profile.grade;
    }
    if (!streamName) {
      streamName = profile.stream_obj?.name || profile.stream || '';
    }
  }

  if (enrollments && enrollments.length > 0) {
    const off = enrollments[0].offering;
    if (!boardId) {
      boardId =
        off?.board ||
        off?.board_id ||
        off?.class?.board_id ||
        (typeof off?.class?.board === 'string' ? off.class.board : off?.class?.board?.id) ||
        '';
    }
    if (off?.class?.grade || off?.grade) {
      grade = off?.class?.grade || off?.grade;
    }
    // Check if enrollment or profile specifies stream
    const foundStream = enrollments.find((e) => e.stream)?.stream || off?.stream || off?.class?.stream;
    if (foundStream) streamName = foundStream;
  }

  const isIelts =
    String(boardId).trim().toLowerCase() === 'ielts' ||
    String(grade).trim().toLowerCase() === 'ielts' ||
    String(streamName).trim().toLowerCase().includes('ielts') ||
    String(streamName).trim().toLowerCase() === 'general training' ||
    String(streamName).trim().toLowerCase() === 'academic';

  if (isIelts) {
    const isGt =
      String(streamName).toLowerCase().includes('general') ||
      String(streamName).toLowerCase().includes('gt');
    if (isGt) {
      return [
        'IELTS Listening',
        'IELTS Reading (GT)',
        'IELTS Writing (GT)',
        'IELTS Reading (Academic)',
        'IELTS Writing (Academic)',
        'IELTS Speaking',
      ];
    }
    return [
      'IELTS Listening',
      'IELTS Reading (Academic)',
      'IELTS Writing (Academic)',
      'IELTS Speaking',
    ];
  }

  const subjects = getSubjectsForStream(grade, streamName, boardId || 'fbise');
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
    if (bIdNorm === 'ielts') return 'IELTS Preparation';
    if (bIdNorm === 'olevel') return 'O Levels (Cambridge / Edexcel)';
    if (bIdNorm === 'alevel') return 'A Levels (Cambridge / Edexcel)';
    if (bIdNorm === 'kpk') return 'KPK Board (BISE Peshawar & Provincial)';
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
          if (offNorm === 'ielts') return 'IELTS Preparation';
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

/** Resolves the grade label for a student (e.g. 'Grade 9', 'Grade 10', or 'IELTS Preparation' with no grade) */
export function getStudentGradeLabel(
  student: {
    grade?: string | null;
    board_id?: string | null;
    board?: { id?: string; name?: string } | string | null;
    class?: { grade?: string; display_name?: string; board_id?: string; board?: { id?: string; name?: string } | string } | null;
    id?: string;
  },
  enrollments?: Array<{ student_id: string; offering_id: string }>,
  offerings?: Array<{ id: string; grade?: string; board?: string; class_id?: string; class?: { board_id?: string; board?: { id?: string; name?: string } | string } }>
): string {
  const boardId =
    student.board_id ||
    (typeof student.board === 'string' ? student.board : student.board?.id) ||
    student.class?.board_id ||
    (typeof student.class?.board === 'string' ? student.class?.board : (student.class?.board as { id?: string })?.id);

  if (boardId && String(boardId).trim().toLowerCase() === 'ielts') {
    return 'IELTS Preparation';
  }

  const rawBoardNorm = String(boardId || '').trim().toLowerCase();
  const isCambridge = rawBoardNorm === 'olevel' || rawBoardNorm === 'alevel';

  const rawGrade = student.class?.grade || student.grade;
  if (rawGrade && (String(rawGrade).trim().toLowerCase() === 'ielts' || String(rawGrade).trim().toLowerCase().includes('ielts'))) {
    return 'IELTS Preparation';
  }

  if (student.class?.grade) {
    if (isCambridge || String(student.class.grade).toLowerCase().startsWith('o') || String(student.class.grade).toLowerCase().startsWith('a')) {
      return `Class ${student.class.grade}`;
    }
    return `Grade ${student.class.grade}`;
  }
  if (student.grade) {
    if (isCambridge || String(student.grade).toLowerCase().startsWith('o') || String(student.grade).toLowerCase().startsWith('a')) {
      return `Class ${student.grade}`;
    }
    return `Grade ${student.grade}`;
  }
  if (student.class?.display_name) {
    if (student.class.display_name.toLowerCase().includes('ielts')) return 'IELTS Preparation';
    return student.class.display_name.startsWith('Grade') || student.class.display_name.startsWith('Class')
      ? student.class.display_name
      : `Grade ${student.class.display_name}`;
  }

  if (enrollments && offerings && student.id) {
    const studentEnrollments = enrollments.filter((e) => e.student_id === student.id);
    for (const en of studentEnrollments) {
      const off = offerings.find((o) => o.id === en.offering_id);
      if (off) {
        const offBoard =
          off.board ||
          off.class?.board_id ||
          (typeof off.class?.board === 'string' ? off.class.board : (off.class?.board as { id?: string })?.id);
        if (offBoard && String(offBoard).trim().toLowerCase() === 'ielts') {
          return 'IELTS Preparation';
        }
        if (off.grade) {
          if (String(off.grade).trim().toLowerCase() === 'ielts') return 'IELTS Preparation';
          if (String(off.grade).toLowerCase().startsWith('o') || String(off.grade).toLowerCase().startsWith('a')) {
            return `Class ${off.grade}`;
          }
          return `Grade ${off.grade}`;
        }
      }
    }
  }

  return 'General';
}

/** Format grade/class label cleanly respecting IELTS (which should never show "Grade IELTS") */
export function formatGradeDisplay(grade?: string | null, board?: string | null): string {
  if (!grade) return 'General';
  const gNorm = String(grade).trim().toLowerCase();
  const bNorm = String(board || '').trim().toLowerCase();
  if (gNorm === 'ielts' || bNorm === 'ielts' || gNorm.includes('ielts')) {
    return 'IELTS Preparation';
  }
  if (bNorm === 'olevel' || bNorm === 'alevel' || gNorm.startsWith('o') || gNorm.startsWith('a')) {
    if (gNorm.startsWith('class ') || gNorm.startsWith('grade ')) return grade;
    return `Class ${grade}`;
  }
  if (gNorm.startsWith('grade') || gNorm.startsWith('class')) return grade;
  return `Grade ${grade}`;
}

/** Resolves the formatted stream label for a student */
export function getStudentStreamLabel(student: {
  stream?: string | null;
  stream_obj?: { name?: string } | null;
  board_id?: string | null;
  board?: any;
}): string {
  const rawBoard =
    student.board_id ||
    (typeof student.board === 'string' ? student.board : student.board?.id);
  const isIelts = rawBoard && String(rawBoard).toLowerCase() === 'ielts';
  const raw = student.stream_obj?.name || student.stream;

  if (isIelts) {
    if (!raw) return 'Academic';
    const lower = raw.trim().toLowerCase();
    if (lower.includes('general') || lower.includes('gt')) return 'General Training';
    if (lower.includes('academic')) return 'Academic';
    return 'Academic';
  }

  if (!raw) return 'General';

  const lower = raw.trim().toLowerCase();
  if (lower.includes('general training') || lower === 'gt') return 'General Training';
  if (lower === 'academic') return 'Academic';
  if (lower.includes('ielts')) return 'IELTS Preparation';
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

/**
 * Produces concise, clean abbreviations for long board and grade labels
 * to prevent text overflowing or truncating awkwardly in table rows and cards.
 * E.g.:
 * - "Grade 9", "Federal Board (FBISE)" -> "Gr. 9 · FBISE"
 * - "IELTS Preparation", "General Training" -> "IELTS Prep · GT"
 * - "IELTS Preparation", "Academic" -> "IELTS Prep · Academic"
 * - "Grade 10", "Sindh Board" -> "Gr. 10 · Sindh"
 * - "Class O1", "O Levels" -> "O1 · O Levels"
 * - "Class A1", "A Levels" -> "A1 · A Levels"
 * - "Grade 9", "KPK Board" -> "Gr. 9 · KPK"
 */
export function formatShortClassAndBoard(params: {
  gradeName?: string | null;
  boardName?: string | null;
  streamName?: string | null;
}): string {
  const g = (params.gradeName || '').trim();
  const b = (params.boardName || '').trim();
  const s = (params.streamName || '').trim();

  const isIelts =
    g.toLowerCase().includes('ielts') ||
    b.toLowerCase().includes('ielts') ||
    s.toLowerCase().includes('ielts') ||
    s.toLowerCase().includes('general training') ||
    s.toLowerCase() === 'gt' ||
    s.toLowerCase() === 'academic';

  if (isIelts) {
    if (s.toLowerCase().includes('general training') || s.toLowerCase() === 'gt') {
      return 'IELTS Prep · GT';
    }
    if (s.toLowerCase().includes('academic')) {
      return 'IELTS Prep · Academic';
    }
    return 'IELTS Prep';
  }

  // Shorten board
  let shortBoard = '';
  if (b.toLowerCase().includes('fbise') || b.toLowerCase().includes('federal')) {
    shortBoard = 'FBISE';
  } else if (b.toLowerCase().includes('punjab')) {
    shortBoard = 'Punjab';
  } else if (b.toLowerCase().includes('sindh')) {
    shortBoard = 'Sindh';
  } else if (b.toLowerCase().includes('olevel') || b.toLowerCase().includes('o level')) {
    shortBoard = 'O Levels';
  } else if (b.toLowerCase().includes('alevel') || b.toLowerCase().includes('a level')) {
    shortBoard = 'A Levels';
  } else if (b.toLowerCase().includes('kpk') || b.toLowerCase().includes('peshawar')) {
    shortBoard = 'KPK';
  } else if (b) {
    shortBoard = b.replace(/board/i, '').replace(/[()]/g, '').trim();
  }

  // Shorten grade
  let shortGrade = g;
  const grMatch = g.match(/grade\s*(\d+)/i);
  if (grMatch) {
    shortGrade = `Gr. ${grMatch[1]}`;
  } else if (g.toLowerCase().startsWith('class ')) {
    const rest = g.slice(6).trim();
    shortGrade = /^\d+$/.test(rest) ? `Gr. ${rest}` : rest;
  }

  if (shortGrade && shortBoard) {
    return `${shortGrade} · ${shortBoard}`;
  }
  return shortGrade || shortBoard || 'General';
}

