import { supabase } from './supabase';
import type {
  WrittenTest,
  WrittenSubmission,
  WrittenTestType,
} from '../types/writtenTest';

const WRITTEN_TESTS_KEY = 'scholario_written_tests_v1';
const WRITTEN_SUBS_KEY = 'scholario_written_subs_v1';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// -----------------------------------------------------------------------------
// LOCAL CACHE HELPERS
// -----------------------------------------------------------------------------

function getStoredWrittenTests(): WrittenTest[] {
  try {
    const raw = localStorage.getItem(WRITTEN_TESTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredWrittenTests(tests: WrittenTest[]): void {
  try {
    localStorage.setItem(WRITTEN_TESTS_KEY, JSON.stringify(tests));
  } catch (err) {
    console.warn('[writtenTestService] saveStoredWrittenTests error:', err);
  }
}

function getStoredWrittenSubmissions(): WrittenSubmission[] {
  try {
    const raw = localStorage.getItem(WRITTEN_SUBS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredWrittenSubmissions(subs: WrittenSubmission[]): void {
  try {
    localStorage.setItem(WRITTEN_SUBS_KEY, JSON.stringify(subs));
  } catch (err) {
    console.warn('[writtenTestService] saveStoredWrittenSubmissions error:', err);
  }
}

// -----------------------------------------------------------------------------
// EXPIRY HELPERS
// -----------------------------------------------------------------------------

export function getRemainingGradingTime(submission: WrittenSubmission): {
  isExpired: boolean;
  remainingMs: number;
  formatted: string;
} {
  const now = Date.now();
  const submittedAtMs = new Date(submission.submitted_at || Date.now()).getTime();
  const elapsed = now - submittedAtMs;
  const isExpired = elapsed > TWENTY_FOUR_HOURS_MS;
  const remainingMs = Math.max(0, TWENTY_FOUR_HOURS_MS - elapsed);
  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const mins = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  let formatted = 'Expired';
  if (!isExpired) {
    formatted = `${hours}h ${mins}m`;
  }

  return { isExpired, remainingMs, formatted };
}

export function isSubmissionExpired(submission: WrittenSubmission): boolean {
  return getRemainingGradingTime(submission).isExpired;
}

// -----------------------------------------------------------------------------
// ADMIN TEST CREATION & MANAGEMENT
// -----------------------------------------------------------------------------

export async function saveWrittenTest(
  test: WrittenTest,
  callerRole: string
): Promise<WrittenTest> {
  const normRole = (callerRole || '').toLowerCase();
  if (normRole !== 'admin') {
    throw new Error('Unauthorized: Only administrators can create or modify tests.');
  }

  // 1. Update in local storage
  const existing = getStoredWrittenTests();
  const index = existing.findIndex((t) => t.id === test.id);
  let updatedList: WrittenTest[];
  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = test;
  } else {
    updatedList = [test, ...existing];
  }
  saveStoredWrittenTests(updatedList);

  // 2. Sync to Express backend /api/written-tests
  try {
    await fetch('/api/written-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test),
    });
  } catch (err) {
    console.warn('[writtenTestService] Sync to backend /api/written-tests warning:', err);
  }

  // 3. Sync to Supabase tests table as well (using instructions payload)
  try {
    await (supabase as any).from('tests').upsert(
      {
        id: test.id,
        title: test.title,
        subject: test.subject,
        grade: test.grade,
        stream: test.stream || null,
        board: test.board || 'fbise',
        due_date: test.due_date,
        duration_minutes: test.duration_minutes,
        total_marks: test.total_marks,
        pass_marks: test.pass_marks || 10,
        file_type: test.type === 'short_question' ? 'short_question_proctored' : 'long_question_proctored',
        status: test.status,
        instructions: JSON.stringify({
          test_type: test.type,
          is_proctored: true,
          is_written_camera: true,
          questions: test.questions,
          user_instructions: test.instructions,
        }),
        created_by: test.created_by,
        created_at: test.created_at,
      },
      { onConflict: 'id' }
    );
  } catch (supaErr) {
    console.warn('[writtenTestService] Supabase upsert note:', supaErr);
  }

  return test;
}

export async function getWrittenTests(filter?: {
  status?: 'published' | 'draft';
  type?: WrittenTestType;
  grade?: string;
  subject?: string;
}): Promise<WrittenTest[]> {
  // Try fetching from server first
  let tests = getStoredWrittenTests();
  try {
    const res = await fetch('/api/written-tests');
    if (res.ok) {
      const data = (await res.json()) as any;
      if (Array.isArray(data.tests) && data.tests.length > 0) {
        // Merge with local storage
        const map = new Map<string, WrittenTest>();
        data.tests.forEach((t: WrittenTest) => map.set(t.id, t));
        tests.forEach((t) => {
          if (!map.has(t.id)) map.set(t.id, t);
        });
        tests = Array.from(map.values());
        saveStoredWrittenTests(tests);
      }
    }
  } catch {
    // Fallback to local
  }

  // Also query Supabase tests table for written tests
  try {
    const { data: supaRows } = await (supabase as any)
      .from('tests')
      .select('*')
      .in('file_type', ['short_question_proctored', 'long_question_proctored']);

    if (Array.isArray(supaRows) && supaRows.length > 0) {
      const map = new Map<string, WrittenTest>();
      tests.forEach((t) => map.set(t.id, t));

      supaRows.forEach((row: any) => {
        try {
          const parsed = row.instructions ? JSON.parse(row.instructions) : {};
          const t: WrittenTest = {
            id: row.id,
            title: row.title,
            type: row.file_type === 'short_question_proctored' ? 'short_question' : 'long_question',
            subject: row.subject,
            grade: String(row.grade || '9'),
            stream: row.stream || 'Biology',
            board: row.board || 'fbise',
            due_date: row.due_date || new Date().toISOString(),
            duration_minutes: row.duration_minutes || 45,
            total_marks: row.total_marks || 25,
            pass_marks: row.pass_marks || 10,
            questions: parsed.questions || [],
            instructions: parsed.user_instructions || '',
            status: row.status || 'published',
            created_at: row.created_at || new Date().toISOString(),
            published_at: row.published_at || row.created_at,
            created_by: row.created_by || '',
            created_by_name: 'Admin',
            is_proctored: true,
            file_type: row.file_type,
          };
          map.set(t.id, t);
        } catch {}
      });

      tests = Array.from(map.values());
      saveStoredWrittenTests(tests);
    }
  } catch {}

  // Apply filters
  return tests.filter((t) => {
    if (filter?.status && t.status !== filter.status) return false;
    if (filter?.type && t.type !== filter.type) return false;
    if (filter?.grade && String(t.grade) !== String(filter.grade)) return false;
    if (filter?.subject && t.subject.toLowerCase() !== filter.subject.toLowerCase()) return false;
    return true;
  });
}

export async function deleteWrittenTest(testId: string, callerRole: string = 'admin'): Promise<void> {
  const normRole = (callerRole || '').toLowerCase();
  if (normRole !== 'admin') {
    throw new Error('Unauthorized: Only administrators can delete tests.');
  }

  const existing = getStoredWrittenTests();
  const updated = existing.filter((t) => t.id !== testId);
  saveStoredWrittenTests(updated);

  try {
    await fetch(`/api/written-tests/${testId}`, { method: 'DELETE' });
  } catch {}

  try {
    await (supabase as any).from('tests').delete().eq('id', testId);
  } catch {}
}

export async function publishWrittenTest(testId: string, callerRole: string = 'admin'): Promise<WrittenTest> {
  const normRole = (callerRole || '').toLowerCase();
  if (normRole !== 'admin') {
    throw new Error('Unauthorized: Only administrators can publish tests.');
  }

  const existing = getStoredWrittenTests();
  const test = existing.find((t) => t.id === testId);
  if (!test) {
    throw new Error('Test not found');
  }

  test.status = 'published';
  return saveWrittenTest(test, callerRole);
}

// -----------------------------------------------------------------------------
// STUDENT SUBMISSION & CAMERA PHOTO UPLOAD (CLOUDFLARE R2)
// -----------------------------------------------------------------------------

export async function uploadExamQuestionPhoto(
  testId: string,
  studentId: string,
  questionId: string,
  photoBlobOrBase64: Blob | string
): Promise<{ success: boolean; photo_url: string; r2_key: string }> {
  try {
    const formData = new FormData();
    formData.append('test_id', testId);
    formData.append('student_id', studentId);
    formData.append('question_id', questionId);
    formData.append('submitted_at', new Date().toISOString());

    if (typeof photoBlobOrBase64 === 'string') {
      formData.append('photo_base64', photoBlobOrBase64);
    } else {
      formData.append('photo', photoBlobOrBase64, `${questionId}.jpg`);
    }

    const res = await fetch('/api/exam-submissions/upload-photo', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to upload photo answer: ${errText}`);
    }

    const data = (await res.json()) as any;
    return {
      success: true,
      photo_url: data.photo_url || `/api/exam-submissions/photo/${testId}/${studentId}/${questionId}`,
      r2_key: data.key || `submissions/${testId}/${studentId}/${questionId}.jpg`,
    };
  } catch (err: any) {
    console.warn('[writtenTestService] uploadExamQuestionPhoto warning:', err);
    // Fallback: if server upload fails (e.g. offline preview), generate local data/object URL
    const fallbackUrl =
      typeof photoBlobOrBase64 === 'string'
        ? photoBlobOrBase64
        : URL.createObjectURL(photoBlobOrBase64);
    return {
      success: true,
      photo_url: fallbackUrl,
      r2_key: `submissions/${testId}/${studentId}/${questionId}.jpg`,
    };
  }
}

export async function submitWrittenTest(
  submission: WrittenSubmission
): Promise<WrittenSubmission> {
  const submittedAt = submission.submitted_at || new Date().toISOString();
  const subWithTime: WrittenSubmission = {
    ...submission,
    submitted_at: submittedAt,
    status: 'submitted',
  };

  // 1. Local Cache
  const existing = getStoredWrittenSubmissions();
  const filtered = existing.filter((s) => s.id !== subWithTime.id);
  const updated = [subWithTime, ...filtered];
  saveStoredWrittenSubmissions(updated);

  // 2. Sync to Express server /api/written-submissions
  try {
    await fetch('/api/written-submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subWithTime),
    });
  } catch (err) {
    console.warn('[writtenTestService] submitWrittenTest backend sync error:', err);
  }

  // 3. Sync to Supabase test_submissions table
  try {
    await (supabase as any).from('test_submissions').upsert(
      {
        id: subWithTime.id,
        test_id: subWithTime.test_id,
        student_id: subWithTime.student_id,
        student_name: subWithTime.student_name,
        student_email: subWithTime.student_email || null,
        grade: subWithTime.grade,
        stream: subWithTime.stream || null,
        subject: subWithTime.subject,
        file_type: subWithTime.test_type === 'short_question' ? 'short_written' : 'long_written',
        submitted_at: subWithTime.submitted_at,
        time_spent_seconds: subWithTime.time_spent_seconds,
        status: 'submitted',
        total_marks: subWithTime.total_marks,
        feedback: JSON.stringify({
          answers: subWithTime.answers,
          test_type: subWithTime.test_type,
          test_title: subWithTime.test_title,
        }),
      },
      { onConflict: 'id' }
    );
  } catch (supaErr) {
    console.warn('[writtenTestService] Supabase submission note:', supaErr);
  }

  return subWithTime;
}

// -----------------------------------------------------------------------------
// TEACHER & ADMIN GRADING
// -----------------------------------------------------------------------------

export async function getWrittenSubmissions(filter?: {
  testId?: string;
  studentId?: string;
}): Promise<WrittenSubmission[]> {
  let list = getStoredWrittenSubmissions();

  // Try fetching from backend first
  try {
    const res = await fetch('/api/written-submissions');
    if (res.ok) {
      const data = (await res.json()) as any;
      if (Array.isArray(data.submissions) && data.submissions.length > 0) {
        const map = new Map<string, WrittenSubmission>();
        data.submissions.forEach((s: WrittenSubmission) => map.set(s.id, s));
        list.forEach((s) => {
          if (!map.has(s.id)) map.set(s.id, s);
        });
        list = Array.from(map.values());
        saveStoredWrittenSubmissions(list);
      }
    }
  } catch {}

  // Also query Supabase test_submissions table
  try {
    const { data: supaSubs } = await (supabase as any)
      .from('test_submissions')
      .select('*')
      .in('file_type', ['short_written', 'long_written']);

    if (Array.isArray(supaSubs) && supaSubs.length > 0) {
      const map = new Map<string, WrittenSubmission>();
      list.forEach((s) => map.set(s.id, s));

      supaSubs.forEach((row: any) => {
        try {
          const parsed = row.feedback ? JSON.parse(row.feedback) : {};
          const sub: WrittenSubmission = {
            id: row.id,
            test_id: row.test_id,
            test_title: parsed.test_title || 'Assessment',
            test_type: row.file_type === 'short_written' ? 'short_question' : 'long_question',
            student_id: row.student_id,
            student_name: row.student_name || 'Student',
            student_email: row.student_email,
            grade: String(row.grade || '9'),
            stream: row.stream,
            subject: row.subject,
            submitted_at: row.submitted_at || row.created_at || new Date().toISOString(),
            time_spent_seconds: row.time_spent_seconds || 0,
            answers: parsed.answers || [],
            final_score: row.score ?? null,
            total_marks: row.total_marks || 25,
            status: row.status === 'graded' ? 'graded' : 'submitted',
            teacher_feedback: row.teacher_feedback || '',
            graded_at: row.graded_at || null,
          };
          map.set(sub.id, sub);
        } catch {}
      });

      list = Array.from(map.values());
      saveStoredWrittenSubmissions(list);
    }
  } catch {}

  // Attach expiry metadata
  const enriched = list.map((s) => {
    const expiry = getRemainingGradingTime(s);
    return {
      ...s,
      is_expired: expiry.isExpired,
      remaining_ms: expiry.remainingMs,
      remaining_formatted: expiry.formatted,
    };
  });

  return enriched.filter((s) => {
    if (filter?.testId && s.test_id !== filter.testId) return false;
    if (filter?.studentId && s.student_id !== filter.studentId) return false;
    return true;
  });
}

export async function gradeWrittenSubmission(payload: {
  submission_id: string;
  per_question_grades: {
    question_id: string;
    marks_awarded: number;
    remarks?: string;
  }[];
  teacher_feedback?: string;
  graded_by: string;
  graded_by_name: string;
}): Promise<WrittenSubmission> {
  const existing = getStoredWrittenSubmissions();
  const sub = existing.find((s) => s.id === payload.submission_id);

  if (!sub) {
    throw new Error('Submission not found.');
  }

  // Check 24-hour expiry: if expired and not already graded, cannot be graded
  const expiry = getRemainingGradingTime(sub);
  if (expiry.isExpired && sub.status !== 'graded') {
    throw new Error(
      'This submission has exceeded the 24-hour grading window and can no longer be graded.'
    );
  }

  // Calculate sum of marks
  const totalAwarded = payload.per_question_grades.reduce(
    (sum, g) => sum + (Number(g.marks_awarded) || 0),
    0
  );

  const updatedAnswers = sub.answers.map((ans) => {
    const g = payload.per_question_grades.find((q) => q.question_id === ans.question_id);
    return {
      ...ans,
      marks_awarded: g ? Number(g.marks_awarded) || 0 : (ans.marks_awarded ?? 0),
      remarks: g ? g.remarks || '' : (ans.remarks || ''),
    };
  });

  const updatedSub: WrittenSubmission = {
    ...sub,
    answers: updatedAnswers,
    final_score: totalAwarded,
    teacher_feedback: payload.teacher_feedback || '',
    status: 'graded',
    graded_at: new Date().toISOString(),
    graded_by: payload.graded_by,
    graded_by_name: payload.graded_by_name,
  };

  // Update local storage
  const updatedList = existing.map((s) => (s.id === updatedSub.id ? updatedSub : s));
  saveStoredWrittenSubmissions(updatedList);

  // Sync to Express backend
  try {
    await fetch('/api/written-submissions/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id: payload.submission_id,
        per_question_grades: payload.per_question_grades,
        teacher_feedback: payload.teacher_feedback,
        graded_by: payload.graded_by,
        graded_by_name: payload.graded_by_name,
      }),
    });
  } catch (err) {
    console.warn('[writtenTestService] gradeWrittenSubmission backend error:', err);
  }

  // Sync to Supabase
  try {
    await (supabase as any)
      .from('test_submissions')
      .update({
        score: totalAwarded,
        status: 'graded',
        teacher_feedback: payload.teacher_feedback || '',
        graded_at: updatedSub.graded_at,
        feedback: JSON.stringify({
          answers: updatedAnswers,
          test_type: sub.test_type,
          test_title: sub.test_title,
        }),
      })
      .eq('id', sub.id);
  } catch {}

  return updatedSub;
}
