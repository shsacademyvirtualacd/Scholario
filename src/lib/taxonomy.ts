// ─────────────────────────────────────────────────────────────────────────────
// Scholario — FBISE Taxonomy (Single Source of Truth)
// ─────────────────────────────────────────────────────────────────────────────
// ALL grade/stream/subject data lives here. No other file may hardcode this
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
}

export const BOARD = { id: 'fbise', name: 'FBISE' } as const;

export const GRADES: GradeDef[] = [
  {
    grade: '9',
    displayName: '9th',
    commonSubjects: ['English', 'Urdu', 'Math', 'Chemistry', 'Physics'],
    streams: [
      { name: 'Biology', subjects: ['English', 'Urdu', 'Math', 'Chemistry', 'Physics', 'Biology'] },
      { name: 'Computer Science', subjects: ['English', 'Urdu', 'Math', 'Chemistry', 'Physics', 'Computer Science'] },
    ],
  },
  {
    grade: '10',
    displayName: '10th',
    commonSubjects: ['English', 'Urdu', 'Math', 'Chemistry', 'Physics'],
    streams: [
      { name: 'Biology', subjects: ['English', 'Urdu', 'Math', 'Chemistry', 'Physics', 'Biology'] },
      { name: 'Computer Science', subjects: ['English', 'Urdu', 'Math', 'Chemistry', 'Physics', 'Computer'] },
    ],
  },
  {
    grade: '11',
    displayName: '11th',
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
    commonSubjects: ['English', 'Urdu'],
    streams: [
      { name: 'Pre-Medical', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology'] },
      { name: 'Pre-Engineering', subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics'] },
      { name: 'ICS', subjects: ['English', 'Urdu', 'Computer Science', 'Mathematics', 'Physics'] },
    ],
  },
];

/** Default monthly tuition price by grade */
export function getDefaultPrice(grade: string): number {
  return ['11', '12'].includes(grade) ? 3499 : 2499;
}

/** All unique subject names used across the entire taxonomy */
export function getAllSubjectNames(): string[] {
  const set = new Set<string>();
  for (const g of GRADES) {
    for (const s of g.streams) {
      for (const sub of s.subjects) {
        set.add(sub);
      }
    }
  }
  return Array.from(set).sort();
}

/** Get streams available for a given grade */
export function getStreamsForGrade(grade: string): StreamDef[] {
  return GRADES.find((g) => g.grade === grade)?.streams ?? [];
}

/** Get subjects for a specific grade + stream combo */
export function getSubjectsForStream(grade: string, streamName: string): string[] {
  const g = GRADES.find((gr) => gr.grade === grade);
  if (!g) return [];
  if (!streamName) return g.commonSubjects || [];
  
  const norm = streamName.trim().toLowerCase();
  const s = g.streams.find((st) => st.name.toLowerCase() === norm || norm.includes(st.name.toLowerCase()) || st.name.toLowerCase().includes(norm));
  if (s) return s.subjects;
  
  // Fallback to first stream or common subjects if stream not recognized precisely
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

