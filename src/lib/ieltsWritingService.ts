/**
 * IELTS Writing Submissions & Manual Teacher Grading Service
 * Handles storing student essay/paragraph responses and provides teachers/admins with manual grading and feedback tools.
 */

import { supabase } from './supabase';

export interface IELTSWritingSubmission {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_grade: string;
  student_stream: string;
  prompt_id: string;
  prompt_title: string;
  prompt_category: string;
  prompt_text: string;
  student_response: string;
  word_count: number;
  time_spent_seconds: number;
  status: 'submitted' | 'graded';
  submitted_at: string;
  graded_at?: string;
  teacher_id?: string;
  teacher_name?: string;
  overall_band?: number; // 1.0 - 9.0
  task_achievement_band?: number; // 1.0 - 9.0
  coherence_cohesion_band?: number; // 1.0 - 9.0
  lexical_resource_band?: number; // 1.0 - 9.0
  grammatical_accuracy_band?: number; // 1.0 - 9.0
  teacher_feedback?: string;
}

const STORAGE_KEY = 'scholario_ielts_writing_submissions';

/** Helper to get stored local submissions fallback */
function getLocalSubmissions(): IELTSWritingSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Helper to save local submissions fallback */
function saveLocalSubmissions(subs: IELTSWritingSubmission[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
  } catch (err) {
    console.warn('[ieltsWritingService] localStorage save error:', err);
  }
}

/**
 * Student: Submits an IELTS writing response for teacher review
 */
export async function submitIELTSWriting(payload: {
  student_id: string;
  student_name: string;
  student_email?: string;
  student_grade?: string;
  student_stream?: string;
  prompt_id: string;
  prompt_title: string;
  prompt_category: string;
  prompt_text: string;
  student_response: string;
  word_count: number;
  time_spent_seconds: number;
}): Promise<IELTSWritingSubmission> {
  const newSubmission: IELTSWritingSubmission = {
    id: `ielts-sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    student_id: payload.student_id,
    student_name: payload.student_name,
    student_email: payload.student_email || '',
    student_grade: payload.student_grade || 'IELTS',
    student_stream: payload.student_stream || 'Academic',
    prompt_id: payload.prompt_id,
    prompt_title: payload.prompt_title,
    prompt_category: payload.prompt_category,
    prompt_text: payload.prompt_text,
    student_response: payload.student_response,
    word_count: payload.word_count,
    time_spent_seconds: payload.time_spent_seconds,
    status: 'submitted',
    submitted_at: new Date().toISOString(),
  };

  // 1. Try Supabase storage if table exists
  try {
    const { data, error } = await (supabase as any)
      .from('ielts_writing_submissions')
      .insert(newSubmission)
      .select()
      .single();

    if (!error && data) {
      // Sync local
      const locals = getLocalSubmissions();
      saveLocalSubmissions([data, ...locals.filter((s) => s.id !== data.id)]);
      return data;
    }
  } catch (err) {
    console.debug('[ieltsWritingService] Supabase insert note, saving to local store:', err);
  }

  // 2. Local store backup
  const locals = getLocalSubmissions();
  const updated = [newSubmission, ...locals.filter((s) => s.id !== newSubmission.id)];
  saveLocalSubmissions(updated);
  return newSubmission;
}

/**
 * Student: Fetches all IELTS writing submissions for a specific student
 */
export async function getStudentIELTSWritingSubmissions(studentId: string): Promise<IELTSWritingSubmission[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('ielts_writing_submissions')
      .select('*')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {
    // Fallback to local
  }

  const locals = getLocalSubmissions();
  return locals.filter((s) => s.student_id === studentId);
}

/**
 * Teacher/Admin: Fetches all IELTS writing submissions for review
 */
export async function getAllIELTSWritingSubmissions(): Promise<IELTSWritingSubmission[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('ielts_writing_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      // Merge with local submissions
      const locals = getLocalSubmissions();
      const map = new Map<string, IELTSWritingSubmission>();
      data.forEach((s) => map.set(s.id, s));
      locals.forEach((s) => {
        if (!map.has(s.id)) map.set(s.id, s);
      });
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );
    }
  } catch {
    // Fallback to local
  }

  return getLocalSubmissions();
}

/**
 * Teacher/Admin: Manually grades an IELTS writing submission
 */
export async function gradeIELTSWritingSubmission(
  submissionId: string,
  grading: {
    teacher_id?: string;
    teacher_name?: string;
    overall_band: number;
    task_achievement_band: number;
    coherence_cohesion_band: number;
    lexical_resource_band: number;
    grammatical_accuracy_band: number;
    teacher_feedback: string;
  }
): Promise<IELTSWritingSubmission> {
  const patch = {
    status: 'graded' as const,
    graded_at: new Date().toISOString(),
    teacher_id: grading.teacher_id || 'Teacher',
    teacher_name: grading.teacher_name || 'Assigned Evaluator',
    overall_band: grading.overall_band,
    task_achievement_band: grading.task_achievement_band,
    coherence_cohesion_band: grading.coherence_cohesion_band,
    lexical_resource_band: grading.lexical_resource_band,
    grammatical_accuracy_band: grading.grammatical_accuracy_band,
    teacher_feedback: grading.teacher_feedback,
  };

  try {
    const { data, error } = await (supabase as any)
      .from('ielts_writing_submissions')
      .update(patch)
      .eq('id', submissionId)
      .select()
      .single();

    if (!error && data) {
      const locals = getLocalSubmissions();
      const updated = locals.map((s) => (s.id === submissionId ? { ...s, ...data } : s));
      saveLocalSubmissions(updated);
      return data;
    }
  } catch (err) {
    console.debug('[ieltsWritingService] Supabase update note:', err);
  }

  // Update in local store
  const locals = getLocalSubmissions();
  let updatedSub: IELTSWritingSubmission | null = null;
  const updatedList = locals.map((s) => {
    if (s.id === submissionId) {
      updatedSub = {
        ...s,
        ...patch,
      };
      return updatedSub;
    }
    return s;
  });

  if (updatedSub) {
    saveLocalSubmissions(updatedList);
    return updatedSub;
  }

  throw new Error('Submission not found.');
}
