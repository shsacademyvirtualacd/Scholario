import type { MCQQuestion, SelfTestConfig, SelfTestResult } from '../types/selfTest';
import { generateCurriculumFallbackMCQs } from './curriculumMCQs';
import { filterAndValidateMCQs } from './mcqValidator';
import { supabase } from './supabase';

const SELF_TEST_HISTORY_KEY = 'scholario_self_test_history_v1';

export async function generateMCQTest(
  config: SelfTestConfig,
  excludeQuestionTexts: string[] = []
): Promise<MCQQuestion[]> {
  const fallback = () =>
    generateCurriculumFallbackMCQs(
      config.subject,
      config.topic,
      config.questionCount * 2,
      config.difficulty,
      config.grade,
      config.board,
      excludeQuestionTexts
    );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch {
      // Session retrieval is optional; endpoint handles unauthenticated gracefully
    }

    const response = await fetch('/api/tests/generate-mcq', {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        ...config,
        excludeQuestionTexts,
      }),
    });
    clearTimeout(timeoutId);

    const validationContext = {
      subject: config.subject,
      topic: config.topic,
      grade: config.grade,
      board: config.board,
    };

    if (response.ok) {
      const data = (await response.json()) as { questions?: MCQQuestion[] };
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        const validated = filterAndValidateMCQs(data.questions, config.questionCount, fallback(), validationContext, excludeQuestionTexts);
        if (validated.length >= config.questionCount) {
          return validated.slice(0, config.questionCount);
        }
      }
    }

    console.warn(`[SelfTest] API response status ${response.status}. Using high-quality curriculum fallback.`);
    const fbPool = fallback();
    return filterAndValidateMCQs(fbPool, config.questionCount, undefined, validationContext, excludeQuestionTexts).slice(0, config.questionCount);
  } catch (err: any) {
    console.warn('Network issue calling /api/tests/generate-mcq, falling back to curriculum question bank:', err);
    const fbPool = fallback();
    return filterAndValidateMCQs(fbPool, config.questionCount, undefined, {
      subject: config.subject,
      topic: config.topic,
      grade: config.grade,
      board: config.board,
    }, excludeQuestionTexts).slice(0, config.questionCount);
  }
}

export function getSelfTestHistory(): SelfTestResult[] {
  try {
    const stored = localStorage.getItem(SELF_TEST_HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (err) {
    console.error('Error reading self test history:', err);
    return [];
  }
}

export function saveSelfTestResult(result: SelfTestResult): void {
  try {
    const history = getSelfTestHistory();
    // Keep the latest 50 tests, avoiding clutter
    const updated = [result, ...history.filter((h) => h.id !== result.id)].slice(0, 50);
    localStorage.setItem(SELF_TEST_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving self test result:', err);
  }
}

export function deleteSelfTestResult(id: string): void {
  try {
    const history = getSelfTestHistory();
    const updated = history.filter((h) => h.id !== id);
    localStorage.setItem(SELF_TEST_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting self test result:', err);
  }
}

export function clearSelfTestHistory(): void {
  try {
    localStorage.removeItem(SELF_TEST_HISTORY_KEY);
  } catch (err) {
    console.error('Error clearing self test history:', err);
  }
}

export interface WeakTopicStat {
  topic: string;
  chapter?: string;
  scorePercentage: number;
  accuracy?: number;
  totalAttempts: number;
  attempts?: number;
  totalQuestions: number;
}

export function getWeakTopicsForStudent(
  subject?: string,
  _board?: string,
  _grade?: string
): WeakTopicStat[] {
  const history = getSelfTestHistory();
  if (history.length === 0) return [];

  const statsByTopic: Record<string, { correct: number; total: number; attempts: number }> = {};

  for (const item of history) {
    if (subject && item.config.subject.toLowerCase() !== subject.toLowerCase()) {
      continue;
    }

    // Process per question if topic/chapter is available on questions
    if (item.questions && item.questions.length > 0) {
      item.questions.forEach((q) => {
        const t = q.chapter || q.topic || item.config.topic;
        if (!t || t === 'Mixed Chapters' || t === 'Full Syllabus') return;
        if (!statsByTopic[t]) {
          statsByTopic[t] = { correct: 0, total: 0, attempts: 0 };
        }
        statsByTopic[t].total += 1;
        if (item.userAnswers[q.id] === q.correctAnswer) {
          statsByTopic[t].correct += 1;
        }
      });
    } else {
      const t = item.config.topic;
      if (!t || t === 'Mixed Chapters' || t === 'Full Syllabus') continue;
      if (!statsByTopic[t]) {
        statsByTopic[t] = { correct: 0, total: 0, attempts: 0 };
      }
      statsByTopic[t].total += item.totalQuestions || 1;
      statsByTopic[t].correct += item.score || 0;
      statsByTopic[t].attempts += 1;
    }
  }

  const results: WeakTopicStat[] = Object.entries(statsByTopic).map(([topic, stat]) => {
    const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    return {
      topic,
      chapter: topic,
      scorePercentage: pct,
      accuracy: pct,
      totalAttempts: stat.attempts || 1,
      attempts: stat.attempts || 1,
      totalQuestions: stat.total,
    };
  });

  // Sort by lowest percentage first (weakest first)
  return results.sort((a, b) => a.scorePercentage - b.scorePercentage);
}

