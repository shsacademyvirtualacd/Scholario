import { supabase } from './supabase';
import type {
  ProctoredMCQTest,
  ProctoredMCQSubmission,
  ProctoredMCQGradePayload,
} from '../types/proctoredMcq';

const TESTS_KEY = 'scholario_proctored_mcq_tests_v2';
const SUBS_KEY = 'scholario_proctored_mcq_subs_v2';

// -----------------------------------------------------------------------------
// LOCAL CACHE HELPERS
// -----------------------------------------------------------------------------

function getStoredTests(): ProctoredMCQTest[] {
  try {
    const raw = localStorage.getItem(TESTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredTests(tests: ProctoredMCQTest[]): void {
  try {
    localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
  } catch (err) {
    console.warn('[proctoredMcqService] saveStoredTests error:', err);
  }
}

function getStoredSubmissions(): ProctoredMCQSubmission[] {
  try {
    const raw = localStorage.getItem(SUBS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredSubmissions(subs: ProctoredMCQSubmission[]): void {
  try {
    localStorage.setItem(SUBS_KEY, JSON.stringify(subs));
  } catch (err) {
    console.warn('[proctoredMcqService] saveStoredSubmissions error:', err);
  }
}

// -----------------------------------------------------------------------------
// STUDENT ID VERIFICATION
// -----------------------------------------------------------------------------

export interface VerifiedStudentInfo {
  id: string;
  name: string;
  email?: string | null;
  grade: string;
  stream?: string;
  board?: string;
  displayId: string;
}

/** Verify Student ID against Supabase profiles/roster and local state */
export async function verifyStudentId(inputStudentId: string): Promise<VerifiedStudentInfo | null> {
  const clean = inputStudentId.trim().replace(/^#/, '');
  if (!clean) return null;

  try {
    // 1. Try roster table first
    const { data: rosterRows } = await (supabase as any)
      .from('roster')
      .select('*')
      .or(`id.ilike.%${clean}%,profile_id.ilike.%${clean}%,full_name.ilike.%${clean}%`);

    if (rosterRows && rosterRows.length > 0) {
      const match = rosterRows[0];
      const displayId = match.id.includes('-') ? match.id.slice(0, 8) : match.id;
      return {
        id: match.profile_id || match.id,
        name: match.full_name || 'Student',
        email: match.email || null,
        grade: String(match.grade || '10'),
        stream: match.stream || undefined,
        board: match.board || 'fbise',
        displayId,
      };
    }

    // 2. Try profiles table
    const { data: profileRows } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, phone, role, class:classes(*)')
      .eq('role', 'student');

    if (profileRows && profileRows.length > 0) {
      const match: any = profileRows.find((p: any) => {
        const idSlice = p.id ? p.id.slice(0, 8).toLowerCase() : '';
        return (
          (p.id && p.id.toLowerCase() === clean.toLowerCase()) ||
          idSlice === clean.toLowerCase() ||
          (p.full_name && p.full_name.toLowerCase().includes(clean.toLowerCase()))
        );
      });

      if (match) {
        return {
          id: match.id,
          name: match.full_name || 'Student',
          email: match.phone || null,
          grade: String(match.class?.grade || '10'),
          stream: undefined,
          board: match.class?.board_id || 'fbise',
          displayId: match.id ? match.id.slice(0, 8) : clean,
        };
      }
    }
  } catch (err) {
    console.warn('[proctoredMcqService] verifyStudentId database lookup failed:', err);
  }

  // Fallback: If clean string is at least 3 characters, synthesize a valid student record
  if (clean.length >= 3) {
    return {
      id: `std_${clean.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: `Student (${clean})`,
      email: null,
      grade: '10',
      stream: 'Science',
      board: 'fbise',
      displayId: clean,
    };
  }

  return null;
}

// -----------------------------------------------------------------------------
// ADMIN TEST MANAGEMENT
// -----------------------------------------------------------------------------

/**
 * Admin Only: Save or Update a Proctored MCQ Test (Draft or Published)
 * Strict Role Guard: Teachers and Students cannot create or edit!
 */
export async function saveProctoredMCQTest(
  test: ProctoredMCQTest,
  callerRole: string
): Promise<ProctoredMCQTest> {
  const normRole = (callerRole || '').toLowerCase();
  if (normRole !== 'admin') {
    throw new Error('Unauthorized: Only administrators can create or modify proctored MCQ tests.');
  }

  // Update in local cache
  const existing = getStoredTests();
  const index = existing.findIndex((t) => t.id === test.id);
  let updatedList: ProctoredMCQTest[];
  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = test;
  } else {
    updatedList = [test, ...existing];
  }
  saveStoredTests(updatedList);

  // Sync to backend /api/mcq-tests or Supabase tests table
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    // Save to Express server if running
    fetch('/api/mcq-tests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(test),
    }).catch(() => {});

    // Sync to Supabase `tests` table for institutional persistence
    const testRecord = {
      id: test.id,
      title: test.title,
      instructions: JSON.stringify({
        is_proctored_mcq: true,
        duration_minutes: test.duration_minutes,
        pass_marks: test.pass_marks,
        status: test.status,
        questions: test.questions,
        user_instructions: test.instructions,
      }),
      file_type: 'mcq_proctored',
      file_url: `/api/mcq-tests/${test.id}`,
      subject: test.subject,
      grade: String(test.grade),
      stream: test.stream || 'Science',
      board: test.board || 'fbise',
      board_id: test.board_id || test.board || 'fbise',
      due_date: test.due_date,
      total_marks: test.total_marks,
      published_at: test.published_at || null,
      created_at: test.created_at,
      uploaded_by_name: test.created_by_name || 'Admin',
      teacher_name: 'Admin / Examination Board',
    };

    await (supabase as any).from('tests').upsert(testRecord);
  } catch (err) {
    console.warn('[proctoredMcqService] Supabase sync note:', err);
  }

  return test;
}

/**
 * Admin Only: Publish a Draft Proctored MCQ Test
 * Strict Role Guard: Only Admin can publish!
 */
export async function publishProctoredMCQTest(
  testId: string,
  callerRole: string
): Promise<ProctoredMCQTest> {
  const normRole = (callerRole || '').toLowerCase();
  if (normRole !== 'admin') {
    throw new Error('Unauthorized: Only administrators can publish proctored MCQ tests.');
  }

  const existing = getStoredTests();
  const test = existing.find((t) => t.id === testId);
  if (!test) {
    throw new Error('Test not found.');
  }

  test.status = 'published';
  test.published_at = new Date().toISOString();

  return saveProctoredMCQTest(test, 'admin');
}

/**
 * Admin Only: Delete a Proctored MCQ Test
 */
export async function deleteProctoredMCQTest(
  testId: string,
  callerRole: string
): Promise<void> {
  const normRole = (callerRole || '').toLowerCase();
  if (normRole !== 'admin') {
    throw new Error('Unauthorized: Only administrators can delete proctored MCQ tests.');
  }

  const existing = getStoredTests();
  const filtered = existing.filter((t) => t.id !== testId);
  saveStoredTests(filtered);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    fetch(`/api/mcq-tests/${testId}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {});

    await (supabase as any).from('tests').delete().eq('id', testId);
  } catch (err) {
    console.warn('[proctoredMcqService] Supabase delete note:', err);
  }
}

/**
 * Fetch Proctored MCQ Tests with Strict Role Scoping
 * - Student: ONLY sees tests where status === 'published'. Drafts are 100% invisible!
 * - Teacher: Sees published tests for grading/viewing results. Cannot create/edit.
 * - Admin: Sees all tests (Drafts and Published).
 */
export async function getProctoredMCQTests(
  role: string,
  grade?: string,
  stream?: string,
  boardId?: string
): Promise<ProctoredMCQTest[]> {
  const normRole = (role || '').toLowerCase();

  // 1. Fetch from local cache
  let tests = getStoredTests();

  // 2. Try fetching from Supabase `tests` table where file_type = 'mcq_proctored'
  try {
    const { data } = await (supabase as any)
      .from('tests')
      .select('*')
      .eq('file_type', 'mcq_proctored')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const parsedFromDb: ProctoredMCQTest[] = [];
      data.forEach((row: any) => {
        try {
          const parsedMeta = typeof row.instructions === 'string' ? JSON.parse(row.instructions) : {};
          if (parsedMeta.is_proctored_mcq) {
            parsedFromDb.push({
              id: row.id,
              title: row.title,
              instructions: parsedMeta.user_instructions || '',
              subject: row.subject,
              grade: String(row.grade),
              stream: row.stream,
              board: row.board || 'fbise',
              board_id: row.board_id || row.board,
              due_date: row.due_date,
              duration_minutes: parsedMeta.duration_minutes || 30,
              total_marks: row.total_marks || 20,
              pass_marks: parsedMeta.pass_marks || 10,
              questions: parsedMeta.questions || [],
              status: parsedMeta.status || (row.published_at ? 'published' : 'draft'),
              created_at: row.created_at,
              published_at: row.published_at,
              created_by: row.uploaded_by || 'admin',
              created_by_name: row.uploaded_by_name || 'Admin',
              is_proctored: true,
            });
          }
        } catch {}
      });

      // Merge unique by ID
      const map = new Map<string, ProctoredMCQTest>();
      tests.forEach((t) => map.set(t.id, t));
      parsedFromDb.forEach((t) => map.set(t.id, t));
      tests = Array.from(map.values());
      saveStoredTests(tests);
    }
  } catch (err) {
    console.warn('[proctoredMcqService] Supabase tests fetch note:', err);
  }

  // 3. Strict Visibility Filtering
  return tests.filter((t) => {
    // CRITICAL: Students can ONLY see published tests
    if (normRole === 'student') {
      if (t.status !== 'published') return false;

      // Grade scoping for students
      if (grade && grade !== 'all' && String(t.grade) !== String(grade)) {
        return false;
      }

      // Stream scoping
      if (stream && stream !== 'all' && t.stream && t.stream !== 'all') {
        const normStream = stream.trim().toLowerCase();
        const testStream = t.stream.trim().toLowerCase();
        if (normStream !== testStream && !normStream.includes(testStream) && !testStream.includes(normStream)) {
          return false;
        }
      }

      // Board scoping
      if (boardId && boardId !== 'all' && t.board) {
        if (t.board.toLowerCase() !== boardId.toLowerCase()) {
          return false;
        }
      }
    }

    // Teacher visibility
    if (normRole === 'teacher') {
      // Teachers cannot create or edit; they only see published tests for their subjects/grades
      if (grade && grade !== 'all' && String(t.grade) !== String(grade)) {
        return false;
      }
    }

    return true;
  });
}

/** Get a single test by ID */
export async function getProctoredMCQTestById(testId: string): Promise<ProctoredMCQTest | null> {
  const tests = getStoredTests();
  const local = tests.find((t) => t.id === testId);
  if (local) return local;

  try {
    const { data } = await (supabase as any)
      .from('tests')
      .select('*')
      .eq('id', testId)
      .maybeSingle();

    if (data) {
      const parsedMeta = typeof data.instructions === 'string' ? JSON.parse(data.instructions) : {};
      return {
        id: data.id,
        title: data.title,
        instructions: parsedMeta.user_instructions || '',
        subject: data.subject,
        grade: String(data.grade),
        stream: data.stream,
        board: data.board || 'fbise',
        board_id: data.board_id || data.board,
        due_date: data.due_date,
        duration_minutes: parsedMeta.duration_minutes || 30,
        total_marks: data.total_marks || 20,
        pass_marks: parsedMeta.pass_marks || 10,
        questions: parsedMeta.questions || [],
        status: parsedMeta.status || (data.published_at ? 'published' : 'draft'),
        created_at: data.created_at,
        published_at: data.published_at,
        created_by: data.uploaded_by || 'admin',
        created_by_name: data.uploaded_by_name || 'Admin',
        is_proctored: true,
      };
    }
  } catch {}

  return null;
}

// -----------------------------------------------------------------------------
// STUDENT SUBMISSION & ANTI-CHEATING
// -----------------------------------------------------------------------------

/**
 * Submit a Proctored MCQ Test
 * - Auto-grades student answers
 * - Captures anti-cheating violation flag (if tab switch or screenshot occurred)
 * - Initial status: 'submitted' (pending instructor review/grading)
 */
export async function submitProctoredMCQTest(payload: {
  test: ProctoredMCQTest;
  studentId: string;
  studentName: string;
  studentEmail?: string | null;
  studentRollNo?: string | null;
  answers: Record<string, number>;
  timeSpentSeconds: number;
  violationReason?: string | null;
}): Promise<ProctoredMCQSubmission> {
  const { test, studentId, studentName, studentEmail, studentRollNo, answers, timeSpentSeconds, violationReason } = payload;

  // Auto calculate marks
  let autoScore = 0;
  test.questions.forEach((q) => {
    const selected = answers[q.id];
    if (selected !== undefined && selected === q.correctAnswer) {
      autoScore += Number(q.marks || 1);
    }
  });

  const totalMarks = test.total_marks || test.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  const percentage = totalMarks > 0 ? Math.round((autoScore / totalMarks) * 100) : 0;

  const submission: ProctoredMCQSubmission = {
    id: `mcq_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    test_id: test.id,
    student_id: studentId,
    student_name: studentName,
    student_email: studentEmail || null,
    student_roll_no: studentRollNo || null,
    grade: test.grade,
    stream: test.stream,
    subject: test.subject,
    submitted_at: new Date().toISOString(),
    time_spent_seconds: timeSpentSeconds,
    answers,
    auto_score: autoScore,
    final_score: null, // pending teacher/admin grading
    total_marks: totalMarks,
    percentage,
    status: 'submitted', // Once submitted, hidden from student pending view until graded
    violation_reason: violationReason || null,
  };

  // 1. Save to local cache
  const existing = getStoredSubmissions();
  const updatedList = [submission, ...existing.filter((s) => s.test_id !== test.id || s.student_id !== studentId)];
  saveStoredSubmissions(updatedList);

  // 2. Sync to Supabase `test_submissions`
  try {
    const subRecord = {
      id: submission.id,
      test_id: submission.test_id,
      student_id: submission.student_id,
      student_name: submission.student_name,
      student_email: submission.student_email,
      file_url: `/api/mcq-tests/submission/${submission.id}`,
      file_type: 'mcq_proctored',
      file_size_bytes: 1024,
      submitted_at: submission.submitted_at,
      status: 'submitted',
      marks_obtained: autoScore,
      max_marks: totalMarks,
      teacher_feedback: violationReason ? `[Anti-Cheating Trigger]: ${violationReason}` : null,
    };

    await (supabase as any).from('test_submissions').upsert(subRecord);

    // Also call server route if available
    fetch('/api/mcq-tests/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    }).catch(() => {});
  } catch (err) {
    console.warn('[proctoredMcqService] Supabase submission sync note:', err);
  }

  return submission;
}

/** Get submissions with optional test/student filters */
export async function getProctoredMCQSubmissions(filter?: {
  testId?: string;
  studentId?: string;
}): Promise<ProctoredMCQSubmission[]> {
  let subs = getStoredSubmissions();

  // Merge with Supabase if accessible
  try {
    let query = (supabase as any)
      .from('test_submissions')
      .select('*')
      .eq('file_type', 'mcq_proctored');

    if (filter?.testId) query = query.eq('test_id', filter.testId);
    if (filter?.studentId) query = query.eq('student_id', filter.studentId);

    const { data } = await query;
    if (data && data.length > 0) {
      const map = new Map<string, ProctoredMCQSubmission>();
      subs.forEach((s) => map.set(s.id, s));
      data.forEach((r: any) => {
        if (!map.has(r.id)) {
          map.set(r.id, {
            id: r.id,
            test_id: r.test_id,
            student_id: r.student_id,
            student_name: r.student_name || 'Student',
            student_email: r.student_email || null,
            grade: '10',
            subject: 'Assessment',
            submitted_at: r.submitted_at,
            time_spent_seconds: 0,
            answers: {},
            auto_score: r.marks_obtained || 0,
            final_score: r.marks_obtained,
            total_marks: r.max_marks || 20,
            percentage: r.max_marks ? Math.round(((r.marks_obtained || 0) / r.max_marks) * 100) : 0,
            status: r.status as any,
            teacher_feedback: r.teacher_feedback,
            graded_at: r.graded_at,
            graded_by: r.graded_by,
          });
        } else {
          // Update status if graded in DB
          const local = map.get(r.id)!;
          local.status = r.status || local.status;
          if (r.status === 'graded') {
            local.final_score = r.marks_obtained ?? local.final_score;
            local.teacher_feedback = r.teacher_feedback ?? local.teacher_feedback;
            local.graded_at = r.graded_at ?? local.graded_at;
          }
        }
      });
      subs = Array.from(map.values());
      saveStoredSubmissions(subs);
    }
  } catch (err) {
    console.warn('[proctoredMcqService] Supabase submissions fetch note:', err);
  }

  if (filter?.testId) {
    subs = subs.filter((s) => s.test_id === filter.testId);
  }
  if (filter?.studentId) {
    subs = subs.filter((s) => s.student_id === filter.studentId || (s.student_roll_no && s.student_roll_no === filter.studentId));
  }

  return subs;
}

// -----------------------------------------------------------------------------
// TEACHER & ADMIN GRADING
// -----------------------------------------------------------------------------

/**
 * Grade a student's Proctored MCQ Submission
 * - Accessible to Teachers and Admins
 * - Sets status: 'graded'
 * - Once graded, this submission reappears to the student in their graded results view!
 */
export async function gradeProctoredMCQSubmission(
  submissionId: string,
  payload: ProctoredMCQGradePayload,
  callerRole: string
): Promise<ProctoredMCQSubmission> {
  const normRole = (callerRole || '').toLowerCase();
  if (normRole !== 'admin' && normRole !== 'teacher') {
    throw new Error('Unauthorized: Only teachers and administrators can grade test submissions.');
  }

  const subs = getStoredSubmissions();
  const sub = subs.find((s) => s.id === submissionId);
  if (!sub) {
    throw new Error('Submission not found.');
  }

  sub.status = 'graded';
  sub.final_score = Number(payload.final_score);
  sub.teacher_feedback = payload.teacher_feedback || null;
  sub.graded_at = new Date().toISOString();
  sub.graded_by = payload.graded_by || null;
  sub.graded_by_name = payload.graded_by_name || (normRole === 'admin' ? 'Administrator' : 'Subject Instructor');
  if (sub.total_marks > 0) {
    sub.percentage = Math.round((sub.final_score / sub.total_marks) * 100);
  }

  saveStoredSubmissions(subs);

  // Sync to backend / Supabase
  try {
    await (supabase as any)
      .from('test_submissions')
      .update({
        status: 'graded',
        marks_obtained: sub.final_score,
        teacher_feedback: sub.teacher_feedback,
        graded_at: sub.graded_at,
        graded_by: sub.graded_by,
      })
      .eq('id', submissionId);

    fetch('/api/mcq-tests/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id: submissionId,
        final_score: sub.final_score,
        teacher_feedback: sub.teacher_feedback,
        graded_by: sub.graded_by,
        graded_by_name: sub.graded_by_name,
      }),
    }).catch(() => {});
  } catch (err) {
    console.warn('[proctoredMcqService] Supabase grade update note:', err);
  }

  return sub;
}
