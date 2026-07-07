// ─────────────────────────────────────────────
// Scholario — Centralized Mock Data
// Used during Batch 2 (Student Portal) development
// ─────────────────────────────────────────────

import type { Profile, Teacher, ClassOffering, ClassSlot, Enrollment, Attendance, Note, StudySession } from '../types';

export const MOCK_USER_ID = 'mock-user-id';

// ─── Student Profile ──────────────────────────
export const MOCK_PROFILE: Profile = {
  id: MOCK_USER_ID,
  role: 'student',
  full_name: 'Rayn Ahmad',
  avatar_url: null,
  phone: '+92 300 123 4567',
  created_at: '2026-06-01T12:00:00Z',
};

export const MOCK_ENROLLMENT = {
  board: 'FBISE' as const,
  grade: '10',
  subject: 'Mathematics',
  total_classes: 48,
  classes_attended: 14,
  classes_remaining: 34,
  streak: 7,
  personal_best_streak: 12,
};

// ─── Teachers ────────────────────────────────
export const MOCK_TEACHERS: Teacher[] = [
  {
    id: 't1',
    full_name: 'Mr. Ahmad Khan',
    avatar_url: null,
    phone: '+92 321 987 6543',
    email: 'ahmad.khan@shs.edu.pk',
    joining_date: '2024-01-10',
    is_active: true,
    created_at: '2024-01-10T08:00:00Z',
  },
  {
    id: 't2',
    full_name: 'Ms. Sara Ahmed',
    avatar_url: null,
    phone: '+92 333 456 7890',
    email: 'sara.ahmed@shs.edu.pk',
    joining_date: '2024-03-15',
    is_active: true,
    created_at: '2024-03-15T08:00:00Z',
  },
  {
    id: 't3',
    full_name: 'Dr. Tariq Mahmood',
    avatar_url: null,
    phone: '+92 300 765 4321',
    email: 'tariq.mahmood@shs.edu.pk',
    joining_date: '2023-09-01',
    is_active: true,
    created_at: '2023-09-01T08:00:00Z',
  }
];

// ─── Class Offerings ─────────────────────────
export const MOCK_OFFERINGS: ClassOffering[] = [
  {
    id: 'o1',
    board: 'fbise',
    grade: '10',
    subject: 'Mathematics',
    teacher_id: 't1',
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'o2',
    board: 'fbise',
    grade: '10',
    subject: 'Physics',
    teacher_id: 't2',
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'o3',
    board: 'fbise',
    grade: '10',
    subject: 'Chemistry',
    teacher_id: 't3',
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'o4',
    board: 'fbise',
    grade: '10',
    subject: 'Biology',
    teacher_id: 't2',
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'o5',
    board: 'fbise',
    grade: '10',
    subject: 'Computer Science',
    teacher_id: 't1',
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'o6',
    board: 'o_level',
    grade: 'o1',
    subject: 'Accounting',
    teacher_id: 't1',
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'o7',
    board: 'o_level',
    grade: 'o1',
    subject: 'Economics',
    teacher_id: 't2',
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'o8',
    board: 'local', // BISE
    grade: '9',
    subject: 'Mathematics',
    teacher_id: 't1',
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'o9',
    board: 'local', // BISE
    grade: '9',
    subject: 'Physics',
    teacher_id: 't2',
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'o10',
    board: 'a_level',
    grade: 'as',
    subject: 'Chemistry',
    teacher_id: 't3',
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'o11',
    board: 'a_level',
    grade: 'as',
    subject: 'Computer Science',
    teacher_id: 't1',
    created_at: '2026-06-01T00:00:00Z',
  }
];

// ─── Timetable Slots (0=Mon ... 5=Sat) ───────
export const MOCK_SCHEDULE_SLOTS: ClassSlot[] = [
  {
    id: 'slot1',
    offering_id: 'o1',
    day_of_week: 0, // Monday
    start_time: '16:00:00',
    end_time: '17:30:00',
    room_or_link: 'Room 102 & Zoom',
    is_cancelled: false,
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'slot2',
    offering_id: 'o2',
    day_of_week: 0, // Monday
    start_time: '18:00:00',
    end_time: '19:30:00',
    room_or_link: 'Room 105',
    is_cancelled: false,
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'slot3',
    offering_id: 'o1',
    day_of_week: 2, // Wednesday
    start_time: '16:00:00',
    end_time: '17:30:00',
    room_or_link: 'Room 102 & Zoom',
    is_cancelled: false,
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'slot4',
    offering_id: 'o2',
    day_of_week: 2, // Wednesday
    start_time: '18:00:00',
    end_time: '19:30:00',
    room_or_link: 'Room 105',
    is_cancelled: true, // Cancelled for testing UI
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'slot5',
    offering_id: 'o3',
    day_of_week: 4, // Friday
    start_time: '16:00:00',
    end_time: '17:30:00',
    room_or_link: 'Chemistry Lab',
    is_cancelled: false,
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'slot6',
    offering_id: 'o1',
    day_of_week: 4, // Friday
    start_time: '18:00:00',
    end_time: '19:30:00',
    room_or_link: 'Room 102',
    is_cancelled: false,
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'slot7',
    offering_id: 'o3',
    day_of_week: 5, // Saturday
    start_time: '11:00:00',
    end_time: '12:30:00',
    room_or_link: 'Room 103',
    is_cancelled: false,
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'slot8',
    offering_id: 'o5',
    day_of_week: 0, // Monday
    start_time: '19:30:00',
    end_time: '21:00:00',
    room_or_link: 'Room 105 & Zoom',
    is_cancelled: false,
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'slot9',
    offering_id: 'o3',
    day_of_week: 2, // Wednesday
    start_time: '18:00:00',
    end_time: '19:30:00',
    room_or_link: 'Chemistry Lab',
    is_cancelled: false,
    created_at: '2026-06-01T00:00:00Z',
  }
];

// Helper to resolve offering details for schedule slots
export const getEnrichedScheduleSlots = () => {
  return MOCK_SCHEDULE_SLOTS.map(slot => {
    const offering = MOCK_OFFERINGS.find(o => o.id === slot.offering_id);
    const teacher = offering ? MOCK_TEACHERS.find(t => t.id === offering.teacher_id) : undefined;
    return {
      ...slot,
      offering: offering ? { ...offering, teacher } : undefined
    };
  });
};

// ─── Recent Notes ─────────────────────────────
export const MOCK_NOTES: Note[] = [
  {
    id: 'n1',
    offering_id: 'o1',
    chapter_name: 'Chapter 4 — Algebraic Expressions',
    title: 'Exercise 4.1 & 4.2 Solved Examples',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    uploaded_by: 'mock-admin-id',
    created_at: '2026-07-05T14:30:00Z',
  },
  {
    id: 'n2',
    offering_id: 'o2',
    chapter_name: 'Chapter 2 — Vectors & Forces',
    title: 'Vectors Addition & Subtraction Mechanics',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    uploaded_by: 'mock-admin-id',
    created_at: '2026-07-03T09:15:00Z',
  },
  {
    id: 'n3',
    offering_id: 'o3',
    chapter_name: 'Chapter 6 — Chemical Bonding',
    title: 'Covalent & Ionic Bonds Diagrams',
    file_url: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
    file_type: 'image',
    uploaded_by: 'mock-admin-id',
    created_at: '2026-06-30T16:45:00Z',
  },
  {
    id: 'n4',
    offering_id: 'o1',
    chapter_name: 'Chapter 3 — Logarithms',
    title: 'Laws of Logarithms Formula Sheet',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    uploaded_by: 'mock-admin-id',
    created_at: '2026-06-25T11:00:00Z',
  },
  {
    id: 'n5',
    offering_id: 'o1',
    chapter_name: 'Chapter 4 — Algebraic Expressions',
    title: 'Algebraic Formulas Cheat Sheet',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    uploaded_by: 'mock-admin-id',
    created_at: '2026-07-06T18:00:00Z',
  },
  {
    id: 'n6',
    offering_id: 'o4',
    chapter_name: 'Chapter 1 — Cell Cycle',
    title: 'Cell Division & Mitosis Diagrams',
    file_url: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=800&q=80',
    file_type: 'image',
    uploaded_by: 'mock-admin-id',
    created_at: '2026-07-05T10:00:00Z',
  },
  {
    id: 'n7',
    offering_id: 'o4',
    chapter_name: 'Chapter 2 — Gaseous Exchange',
    title: 'Human Respiratory System Overview',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    uploaded_by: 'mock-admin-id',
    created_at: '2026-07-04T12:30:00Z',
  },
  {
    id: 'n8',
    offering_id: 'o5',
    chapter_name: 'Chapter 1 — Database Systems',
    title: 'Relational Database Concepts & Schema',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    uploaded_by: 'mock-admin-id',
    created_at: '2026-07-03T11:15:00Z',
  },
  {
    id: 'n9',
    offering_id: 'o5',
    chapter_name: 'Chapter 2 — Computer Networks',
    title: 'Network Topologies & Protocol Reference',
    file_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    file_type: 'image',
    uploaded_by: 'mock-admin-id',
    created_at: '2026-07-02T15:00:00Z',
  },
  {
    id: 'n10',
    offering_id: 'o6',
    chapter_name: 'Chapter 1 — Introduction to Accounting',
    title: 'Double Entry Ledger System balancing principles',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    uploaded_by: 'mock-admin-id',
    created_at: '2026-07-01T10:00:00Z',
  },
  {
    id: 'n11',
    offering_id: 'o7',
    chapter_name: 'Chapter 2 — Microeconomics',
    title: 'Price Elasticity of Demand & Supply curves diagram',
    file_url: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
    file_type: 'image',
    uploaded_by: 'mock-admin-id',
    created_at: '2026-06-30T11:00:00Z',
  }
];

export const getEnrichedNotes = () => {
  return MOCK_NOTES.map(note => {
    const offering = MOCK_OFFERINGS.find(o => o.id === note.offering_id);
    return {
      ...note,
      offering
    };
  });
};

// ─── Attendance Records ────────────────────────
export const MOCK_ATTENDANCE: Attendance[] = [
  // Attendance log for current student
  {
    id: 'att1',
    student_id: MOCK_USER_ID,
    slot_id: 'slot1',
    session_date: '2026-07-06', // Monday (Yesterday relative to current system date)
    status: 'present',
    marked_at: '2026-07-06T16:05:00Z',
  },
  {
    id: 'att2',
    student_id: MOCK_USER_ID,
    slot_id: 'slot3',
    session_date: '2026-07-01', // Previous Wednesday
    status: 'present',
    marked_at: '2026-07-01T16:03:00Z',
  },
  {
    id: 'att3',
    student_id: MOCK_USER_ID,
    slot_id: 'slot4',
    session_date: '2026-07-01', // Previous Wednesday Physics (cancelled in mock, but let's say they missed some past class)
    status: 'absent',
    marked_at: '2026-07-01T18:15:00Z',
  },
  {
    id: 'att4',
    student_id: MOCK_USER_ID,
    slot_id: 'slot5',
    session_date: '2026-07-03', // Previous Friday Chemistry
    status: 'late',
    marked_at: '2026-07-03T16:20:00Z',
  },
  {
    id: 'att5',
    student_id: MOCK_USER_ID,
    slot_id: 'slot6',
    session_date: '2026-07-03', // Previous Friday Maths
    status: 'present',
    marked_at: '2026-07-03T18:02:00Z',
  },
  {
    id: 'att6',
    student_id: MOCK_USER_ID,
    slot_id: 'slot7',
    session_date: '2026-07-04', // Previous Saturday Chemistry
    status: 'present',
    marked_at: '2026-07-04T11:05:00Z',
  },
  {
    id: 'att7',
    student_id: MOCK_USER_ID,
    slot_id: 'slot1',
    session_date: '2026-06-29', // Two Mondays ago
    status: 'present',
    marked_at: '2026-06-29T16:02:00Z',
  },
  {
    id: 'att8',
    student_id: MOCK_USER_ID,
    slot_id: 'slot2',
    session_date: '2026-06-29',
    status: 'present',
    marked_at: '2026-06-29T18:05:00Z',
  },
  {
    id: 'att9',
    student_id: MOCK_USER_ID,
    slot_id: 'slot3',
    session_date: '2026-06-24',
    status: 'absent',
    marked_at: '2026-06-24T16:00:00Z',
  },
  {
    id: 'att10',
    student_id: MOCK_USER_ID,
    slot_id: 'slot4',
    session_date: '2026-06-24',
    status: 'present',
    marked_at: '2026-06-24T18:02:00Z',
  },
  {
    id: 'att11',
    student_id: MOCK_USER_ID,
    slot_id: 'slot5',
    session_date: '2026-06-26',
    status: 'present',
    marked_at: '2026-06-26T16:05:00Z',
  },
  {
    id: 'att12',
    student_id: MOCK_USER_ID,
    slot_id: 'slot6',
    session_date: '2026-06-26',
    status: 'present',
    marked_at: '2026-06-26T18:04:00Z',
  },
  {
    id: 'att13',
    student_id: MOCK_USER_ID,
    slot_id: 'slot7',
    session_date: '2026-06-27',
    status: 'present',
    marked_at: '2026-06-27T11:03:00Z',
  },
  {
    id: 'att14',
    student_id: MOCK_USER_ID,
    slot_id: 'slot1',
    session_date: '2026-06-22',
    status: 'present',
    marked_at: '2026-06-22T16:01:00Z',
  },
  // Ali Hassan (s1)
  { id: 'att_s1_1', student_id: 's1', slot_id: 'slot1', session_date: '2026-07-06', status: 'present', marked_at: '2026-07-06T16:05:00Z' },
  { id: 'att_s1_2', student_id: 's1', slot_id: 'slot3', session_date: '2026-07-01', status: 'absent', marked_at: '2026-07-01T16:00:00Z' },
  { id: 'att_s1_3', student_id: 's1', slot_id: 'slot6', session_date: '2026-07-03', status: 'present', marked_at: '2026-07-03T18:05:00Z' },
  { id: 'att_s1_4', student_id: 's1', slot_id: 'slot1', session_date: '2026-06-29', status: 'absent', marked_at: '2026-06-29T16:00:00Z' },
  { id: 'att_s1_5', student_id: 's1', slot_id: 'slot3', session_date: '2026-06-24', status: 'present', marked_at: '2026-06-24T16:05:00Z' },
  { id: 'att_s1_6', student_id: 's1', slot_id: 'slot6', session_date: '2026-06-26', status: 'absent', marked_at: '2026-06-26T18:00:00Z' },
  { id: 'att_s1_7', student_id: 's1', slot_id: 'slot1', session_date: '2026-06-22', status: 'present', marked_at: '2026-06-22T16:02:00Z' },
  // Sara Malik (s2)
  { id: 'att_s2_1', student_id: 's2', slot_id: 'slot2', session_date: '2026-07-06', status: 'present', marked_at: '2026-07-06T18:05:00Z' },
  { id: 'att_s2_2', student_id: 's2', slot_id: 'slot4', session_date: '2026-07-01', status: 'absent', marked_at: '2026-07-01T18:00:00Z' },
  { id: 'att_s2_3', student_id: 's2', slot_id: 'slot5', session_date: '2026-07-03', status: 'present', marked_at: '2026-07-03T16:05:00Z' },
  { id: 'att_s2_4', student_id: 's2', slot_id: 'slot7', session_date: '2026-07-04', status: 'present', marked_at: '2026-07-04T11:05:00Z' },
  { id: 'att_s2_5', student_id: 's2', slot_id: 'slot2', session_date: '2026-06-29', status: 'absent', marked_at: '2026-06-29T18:00:00Z' },
  // Usman Khan (s3)
  { id: 'att_s3_1', student_id: 's3', slot_id: 'slot1', session_date: '2026-07-06', status: 'present', marked_at: '2026-07-06T16:05:00Z' },
  { id: 'att_s3_2', student_id: 's3', slot_id: 'slot2', session_date: '2026-07-06', status: 'present', marked_at: '2026-07-06T18:05:00Z' },
  { id: 'att_s3_3', student_id: 's3', slot_id: 'slot3', session_date: '2026-07-01', status: 'absent', marked_at: '2026-07-01T16:00:00Z' },
  { id: 'att_s3_4', student_id: 's3', slot_id: 'slot5', session_date: '2026-07-03', status: 'present', marked_at: '2026-07-03T16:05:00Z' },
  { id: 'att_s3_5', student_id: 's3', slot_id: 'slot6', session_date: '2026-07-03', status: 'absent', marked_at: '2026-07-03T18:00:00Z' }
];

export const getEnrichedAttendance = () => {
  return MOCK_ATTENDANCE.map(att => {
    const slot = MOCK_SCHEDULE_SLOTS.find(s => s.id === att.slot_id);
    const offering = slot ? MOCK_OFFERINGS.find(o => o.id === slot.offering_id) : undefined;
    const teacher = offering ? MOCK_TEACHERS.find(t => t.id === offering.teacher_id) : undefined;
    return {
      ...att,
      slot: slot ? { ...slot, offering: offering ? { ...offering, teacher } : undefined } : undefined
    };
  });
};

export type StudentGroup = 'pre-medical' | 'pre-engineering' | 'ics';

export const GROUP_SUBJECTS: Record<StudentGroup, string[]> = {
  'pre-medical': ['Biology', 'Physics', 'Chemistry'],
  'pre-engineering': ['Mathematics', 'Physics', 'Chemistry'],
  'ics': ['Computer Science', 'Mathematics', 'Physics']
};

// ─── Students List ────────────────────────────────
export const MOCK_STUDENTS: Profile[] = [
  MOCK_PROFILE, // Rayn Ahmad
  { id: 's1', role: 'student', full_name: 'Ali Hassan', avatar_url: null, phone: '+92 301 234 5678', created_at: '2026-06-01T12:00:00Z', stream: 'ics' },
  { id: 's2', role: 'student', full_name: 'Sara Malik', avatar_url: null, phone: '+92 302 345 6789', created_at: '2026-06-01T12:00:00Z', stream: 'pre-medical' },
  { id: 's3', role: 'student', full_name: 'Usman Khan', avatar_url: null, phone: '+92 303 456 7890', created_at: '2026-06-01T12:00:00Z', stream: 'pre-engineering' },
  { id: 's4', role: 'student', full_name: 'Nadia Iqbal', avatar_url: null, phone: '+92 304 567 8901', created_at: '2026-06-01T12:00:00Z', stream: 'ics' },
  { id: 's5', role: 'student', full_name: 'Zainab Bibi', avatar_url: null, phone: '+92 305 678 9012', created_at: '2026-06-01T12:00:00Z', stream: 'pre-medical' },
  { id: 's6', role: 'student', full_name: 'Hamza Bilal', avatar_url: null, phone: '+92 306 789 0123', created_at: '2026-06-01T12:00:00Z', stream: 'pre-engineering' },
  { id: 's7', role: 'student', full_name: 'Bilal Shah', avatar_url: null, phone: '+92 307 890 1234', created_at: '2026-06-01T12:00:00Z', stream: 'ics' },
  { id: 's8', role: 'student', full_name: 'Fatima Zahra', avatar_url: null, phone: '+92 308 901 2345', created_at: '2026-06-01T12:00:00Z', stream: 'pre-medical' }
];

// ─── Enrollments ──────────────────────────────────
export const MOCK_ENROLLMENTS: Enrollment[] = [
  // Rayn Ahmad (Mathematics, Physics, Chemistry)
  { id: 'e_r1', student_id: MOCK_USER_ID, offering_id: 'o1', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_r2', student_id: MOCK_USER_ID, offering_id: 'o2', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_r3', student_id: MOCK_USER_ID, offering_id: 'o3', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },

  // Ali Hassan (Mathematics, Physics, Computer Science)
  { id: 'e_s1_1', student_id: 's1', offering_id: 'o1', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s1_2', student_id: 's1', offering_id: 'o2', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s1_3', student_id: 's1', offering_id: 'o5', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },

  // Sara Malik (Biology, Physics, Chemistry)
  { id: 'e_s2_1', student_id: 's2', offering_id: 'o4', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s2_2', student_id: 's2', offering_id: 'o2', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s2_3', student_id: 's2', offering_id: 'o3', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },

  // Usman Khan (Mathematics, Physics, Chemistry)
  { id: 'e_s3_1', student_id: 's3', offering_id: 'o1', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s3_2', student_id: 's3', offering_id: 'o2', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s3_3', student_id: 's3', offering_id: 'o3', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },

  // Nadia Iqbal (Mathematics, Physics, Computer Science)
  { id: 'e_s4_1', student_id: 's4', offering_id: 'o1', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s4_2', student_id: 's4', offering_id: 'o2', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s4_3', student_id: 's4', offering_id: 'o5', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },

  // Zainab Bibi (Biology, Physics, Chemistry)
  { id: 'e_s5_1', student_id: 's5', offering_id: 'o4', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s5_2', student_id: 's5', offering_id: 'o2', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s5_3', student_id: 's5', offering_id: 'o3', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },

  // Hamza Bilal (Mathematics, Physics, Chemistry)
  { id: 'e_s6_1', student_id: 's6', offering_id: 'o1', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s6_2', student_id: 's6', offering_id: 'o2', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s6_3', student_id: 's6', offering_id: 'o3', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },

  // Bilal Shah (Accounting, Economics)
  { id: 'e_s7_1', student_id: 's7', offering_id: 'o6', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s7_2', student_id: 's7', offering_id: 'o7', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },

  // Fatima Zahra (Biology, Physics, Chemistry)
  { id: 'e_s8_1', student_id: 's8', offering_id: 'o4', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s8_2', student_id: 's8', offering_id: 'o2', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' },
  { id: 'e_s8_3', student_id: 's8', offering_id: 'o3', total_classes: 48, enrolled_at: '2026-06-01T12:00:00Z' }
];

// ─── Helpers ──────────────────────────────────────
export const getStudentsByOffering = (offeringId: string): Profile[] => {
  const enrollments = MOCK_ENROLLMENTS.filter(e => e.offering_id === offeringId);
  return MOCK_STUDENTS.filter(s => enrollments.some(e => e.student_id === s.id));
};

export const getSessionAttendance = (slotId: string, date: string): Attendance[] => {
  return MOCK_ATTENDANCE.filter(a => a.slot_id === slotId && a.session_date === date);
};

export const getTeacherOfferings = (teacherId: string): ClassOffering[] => {
  return MOCK_OFFERINGS.filter(o => o.teacher_id === teacherId);
};

export const getStudentsByTeacher = (teacherId: string): Profile[] => {
  const teacherOfferingIds = getTeacherOfferings(teacherId).map(o => o.id);
  const enrollments = MOCK_ENROLLMENTS.filter(e => teacherOfferingIds.includes(e.offering_id));
  return MOCK_STUDENTS.filter(s => enrollments.some(e => e.student_id === s.id));
};

// ─── News & Announcements ─────────────────────────
export interface Announcement {
  id: string;
  title: string;
  content: string;
  time: string;
  date: string;
  icon?: string;
  priority?: 'high' | 'medium' | 'low';
  offering_id?: string;
}

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Mid-term exams schedule released',
    content: 'The mid-term exams schedule for Grades 9, 10, and 11 has been officially released. Check your student inbox or the courses panel to view slot assignments.',
    time: '2 hours ago',
    date: '2026-07-06',
    icon: '📋',
    priority: 'high',
  },
  {
    id: 'ann-2',
    title: 'Holiday notice — Eid ul-Adha break',
    content: 'SHS Academy will remain closed from June 15 to June 20 for Eid ul-Adha. Regular online classes will resume on Monday, June 22.',
    time: '1 day ago',
    date: '2026-07-05',
    icon: '🎉',
    priority: 'low',
  }
];

const loadAnnouncementsFromStorage = (): Announcement[] => {
  try {
    const data = localStorage.getItem('scholario_announcements');
    return data ? JSON.parse(data) : DEFAULT_ANNOUNCEMENTS;
  } catch (e) {
    return DEFAULT_ANNOUNCEMENTS;
  }
};

const saveAnnouncementsToStorage = (arr: Announcement[]) => {
  try {
    localStorage.setItem('scholario_announcements', JSON.stringify(arr));
    window.dispatchEvent(new CustomEvent('scholario_announcements_updated', { detail: arr }));
  } catch (e) {
    console.error(e);
  }
};

if (typeof window !== 'undefined' && !localStorage.getItem('scholario_announcements')) {
  localStorage.setItem('scholario_announcements', JSON.stringify(DEFAULT_ANNOUNCEMENTS));
}

const targetArray = loadAnnouncementsFromStorage();

export const MOCK_ANNOUNCEMENTS = new Proxy(targetArray, {
  set(target, prop, value, receiver) {
    const res = Reflect.set(target, prop, value, receiver);
    saveAnnouncementsToStorage(target);
    return res;
  },
  deleteProperty(target, prop) {
    const res = Reflect.deleteProperty(target, prop);
    saveAnnouncementsToStorage(target);
    return res;
  }
});

export interface RosterEntry {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  class_ids: string[];
  profile_id: string | null;
  created_at: string;
}

const DEFAULT_ROSTER: RosterEntry[] = [
  {
    id: 'r_dev',
    email: 'student@example.com',
    full_name: 'Rayn Ahmad',
    role: 'student',
    class_ids: ['o1'],
    profile_id: 'mock-user-id',
    created_at: '2026-06-01T12:00:00Z',
  },
  {
    id: 'r_dev_admin',
    email: 'admin@example.com',
    full_name: 'Dev Admin',
    role: 'admin',
    class_ids: [],
    profile_id: 'mock-admin-id',
    created_at: '2026-06-01T12:00:00Z',
  },
  {
    id: 'r1',
    email: 'student1@example.com',
    full_name: 'Ali Hassan',
    role: 'student',
    class_ids: ['o1'],
    profile_id: 's1',
    created_at: '2026-06-01T12:00:00Z',
  },
  {
    id: 'r2',
    email: 'student2@example.com',
    full_name: 'Sara Malik',
    role: 'student',
    class_ids: ['o4'],
    profile_id: 's2',
    created_at: '2026-06-01T12:00:00Z',
  },
  {
    id: 'r3',
    email: 'ahmad.khan@shs.edu.pk',
    full_name: 'Mr. Ahmad Khan',
    role: 'teacher',
    class_ids: ['o1', 'o5', 'o6', 'o8', 'o11'],
    profile_id: 't1',
    created_at: '2024-01-10T08:00:00Z',
  },
  {
    id: 'r4',
    email: 'pending_student@example.com',
    full_name: 'Haris Farooq',
    role: 'student',
    class_ids: ['o1'],
    profile_id: null,
    created_at: '2026-07-07T12:00:00Z',
  },
  {
    id: 'r5',
    email: 'pending_teacher@example.com',
    full_name: 'Ms. Ayesha Ghafoor',
    role: 'teacher',
    class_ids: ['o2', 'o9'],
    profile_id: null,
    created_at: '2026-07-07T12:00:00Z',
  }
];

const loadRosterFromStorage = (): RosterEntry[] => {
  if (typeof window === 'undefined') return DEFAULT_ROSTER;
  try {
    const raw = localStorage.getItem('scholario_roster');
    if (!raw) return DEFAULT_ROSTER;
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_ROSTER;
  }
};

const saveRosterToStorage = (arr: RosterEntry[]) => {
  try {
    localStorage.setItem('scholario_roster', JSON.stringify(arr));
  } catch (e) {
    console.error(e);
  }
};

if (typeof window !== 'undefined' && !localStorage.getItem('scholario_roster')) {
  localStorage.setItem('scholario_roster', JSON.stringify(DEFAULT_ROSTER));
}

const rosterArray = loadRosterFromStorage();

export const MOCK_ROSTER = new Proxy(rosterArray, {
  set(target, prop, value, receiver) {
    const res = Reflect.set(target, prop, value, receiver);
    saveRosterToStorage(target);
    return res;
  },
  deleteProperty(target, prop) {
    const res = Reflect.deleteProperty(target, prop);
    saveRosterToStorage(target);
    return res;
  }
});

// ─── Fee System Types & Mock Data ─────────────────
export interface MockFeeConfig {
  id: string;
  class_id: string;
  amount: number;
  payment_instructions: string;
  whatsapp_number: string;
}

export interface MockFeeStatus {
  id: string;
  student_id: string;
  status: 'unpaid' | 'pending' | 'paid';
  updated_at: string;
}

export interface MockFeeAuditLog {
  id: string;
  student_id: string;
  status_from: string;
  status_to: string;
  changed_by: string;
  changed_at: string;
  notes: string;
}

const DEFAULT_FEE_CONFIGS: MockFeeConfig[] = [
  {
    id: 'fc1',
    class_id: 'o1',
    amount: 4500,
    payment_instructions: 'Bank Alfalah\nAccount Title: SHS Academy\nAccount No: 5502-1928-3746\n\nJazzCash / Easypaisa:\nNumber: 0300-1234567\nName: Ahmad Khan',
    whatsapp_number: '+923001234567'
  },
  {
    id: 'fc2',
    class_id: 'o2',
    amount: 4000,
    payment_instructions: 'Bank Alfalah\nAccount Title: SHS Academy\nAccount No: 5502-1928-3746\n\nJazzCash / Easypaisa:\nNumber: 0300-1234567\nName: Ahmad Khan',
    whatsapp_number: '+923001234567'
  }
];

const DEFAULT_FEE_STATUSES: MockFeeStatus[] = [
  {
    id: 'fs_dev',
    student_id: 'mock-user-id',
    status: 'unpaid',
    updated_at: new Date().toISOString()
  },
  {
    id: 'fs_s1',
    student_id: 's1',
    status: 'pending',
    updated_at: new Date().toISOString()
  },
  {
    id: 'fs_s2',
    student_id: 's2',
    status: 'paid',
    updated_at: new Date().toISOString()
  }
];

const DEFAULT_FEE_AUDIT_LOGS: MockFeeAuditLog[] = [
  {
    id: 'al1',
    student_id: 's2',
    status_from: 'pending',
    status_to: 'paid',
    changed_by: 'mock-admin-id',
    changed_at: new Date().toISOString(),
    notes: 'Payment verified manually via WhatsApp screenshot.'
  }
];

const loadFromStorage = <T>(key: string, def: T[]): T[] => {
  if (typeof window === 'undefined') return def;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : def;
  } catch (e) {
    return def;
  }
};

const saveToStorage = <T>(key: string, arr: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) {
    console.error(e);
  }
};

if (typeof window !== 'undefined') {
  if (!localStorage.getItem('scholario_fee_configs')) saveToStorage('scholario_fee_configs', DEFAULT_FEE_CONFIGS);
  if (!localStorage.getItem('scholario_fee_statuses')) saveToStorage('scholario_fee_statuses', DEFAULT_FEE_STATUSES);
  if (!localStorage.getItem('scholario_fee_audit_logs')) saveToStorage('scholario_fee_audit_logs', DEFAULT_FEE_AUDIT_LOGS);
}

export const MOCK_FEE_CONFIGS = new Proxy(loadFromStorage('scholario_fee_configs', DEFAULT_FEE_CONFIGS), {
  set(target, prop, value, receiver) {
    const res = Reflect.set(target, prop, value, receiver);
    saveToStorage('scholario_fee_configs', target);
    return res;
  }
});

export const MOCK_FEE_STATUSES = new Proxy(loadFromStorage('scholario_fee_statuses', DEFAULT_FEE_STATUSES), {
  set(target, prop, value, receiver) {
    const res = Reflect.set(target, prop, value, receiver);
    saveToStorage('scholario_fee_statuses', target);
    return res;
  }
});

export const MOCK_FEE_AUDIT_LOGS = new Proxy(loadFromStorage('scholario_fee_audit_logs', DEFAULT_FEE_AUDIT_LOGS), {
  set(target, prop, value, receiver) {
    const res = Reflect.set(target, prop, value, receiver);
    saveToStorage('scholario_fee_audit_logs', target);
    return res;
  }
});





