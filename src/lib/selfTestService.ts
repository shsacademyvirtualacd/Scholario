import type { MCQQuestion, SelfTestConfig, SelfTestResult } from '../types/selfTest';
import { generateCurriculumFallbackMCQs } from './curriculumMCQs';
import { filterAndValidateMCQs } from './mcqValidator';
import { supabase } from './supabase';
import { fetchStoredMCQTest } from './questionBankService';

const SELF_TEST_HISTORY_KEY = 'scholario_self_test_history_v1';

export async function generateMCQTest(
  config: SelfTestConfig,
  excludeQuestionTexts: string[] = []
): Promise<MCQQuestion[]> {
  const targetCount = Math.min(Math.max(Number(config.questionCount) || 10, 1), 30);
  const accumulatedQuestions: MCQQuestion[] = [];
  const allExcludes = [...excludeQuestionTexts];

  const validationContext = {
    subject: config.subject,
    topic: config.topic,
    grade: config.grade,
    board: config.board,
  };

  const getFallbackPool = (count: number) =>
    generateCurriculumFallbackMCQs(
      config.subject,
      config.topic,
      count,
      config.difficulty,
      config.grade,
      config.board,
      allExcludes
    );

  // ── 1. PRIMARY PATH: Stored Pre-Generated MCQ Question Bank ─────────────────
  try {
    const bankResult = await fetchStoredMCQTest({
      subject: config.subject,
      topic: config.topic,
      grade: config.grade,
      board: config.board,
      count: targetCount,
      difficulty: config.difficulty,
      excludeTexts: allExcludes,
      selectedChapters: config.selectedChapters,
      examMode: config.examMode,
    });

    if (bankResult && Array.isArray(bankResult.questions) && bankResult.questions.length > 0) {
      const validatedFromBank = filterAndValidateMCQs(
        bankResult.questions,
        targetCount,
        undefined, // Don't backfill here, keep pure bank items first
        validationContext,
        allExcludes
      );

      for (const q of validatedFromBank) {
        if (!accumulatedQuestions.some((ex) => ex.id === q.id || ex.question.toLowerCase() === q.question.toLowerCase())) {
          accumulatedQuestions.push(q);
          allExcludes.push(q.question.toLowerCase());
        }
      }

      if (accumulatedQuestions.length >= targetCount) {
        console.log(`[SelfTest] Instant generation success from pre-generated MCQ bank (${accumulatedQuestions.length} questions).`);
        return accumulatedQuestions.slice(0, targetCount);
      }
    }
  } catch (bankErr) {
    console.warn('[SelfTest] Stored question bank retrieval failed or was partial; proceeding with secondary API path:', bankErr);
  }

  // ── 2. SECONDARY PATH: Live API Generation with Automatic Retry ──────────────
  const remainingNeeded = targetCount - accumulatedQuestions.length;
  const maxApiRetries = 2;

  for (let attempt = 1; attempt <= maxApiRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout per attempt

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
        // Session retrieval is optional
      }

      console.log(`[SelfTest] Calling /api/tests/generate-mcq (Attempt ${attempt}/${maxApiRetries}) for ${remainingNeeded} questions...`);

      const response = await fetch('/api/tests/generate-mcq', {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          ...config,
          questionCount: remainingNeeded,
          excludeQuestionTexts: allExcludes,
        }),
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as { questions?: MCQQuestion[]; source?: string; model?: string; error?: string };
        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
          const validated = filterAndValidateMCQs(
            data.questions,
            remainingNeeded,
            undefined,
            validationContext,
            allExcludes
          );

          for (const q of validated) {
            if (!accumulatedQuestions.some((ex) => ex.id === q.id || ex.question.toLowerCase() === q.question.toLowerCase())) {
              accumulatedQuestions.push(q);
              allExcludes.push(q.question.toLowerCase());
            }
          }

          if (accumulatedQuestions.length >= targetCount) {
            console.log(`[SelfTest] Successfully assembled ${accumulatedQuestions.length} questions (source: ${data.source || 'api'}, model: ${data.model || 'unknown'}).`);
            return accumulatedQuestions.slice(0, targetCount);
          }
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown server error');
        console.warn(`[SelfTest] API attempt ${attempt} returned status ${response.status}:`, errorText);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`[SelfTest] API attempt ${attempt} error (${err.name === 'AbortError' ? 'Timeout' : err.message}):`, err);
    }

    // Small delay before next retry if not last attempt
    if (attempt < maxApiRetries && accumulatedQuestions.length < targetCount) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  // ── 3. TERTIARY PATH: Guaranteed Curriculum Bank Backfill ───────────────────
  if (accumulatedQuestions.length < targetCount) {
    const needed = targetCount - accumulatedQuestions.length;
    console.log(`[SelfTest] Backfilling remaining ${needed} questions from verified curriculum bank.`);
    const fallbackPool = getFallbackPool(needed * 2);

    for (const q of fallbackPool) {
      if (accumulatedQuestions.length >= targetCount) break;
      if (!accumulatedQuestions.some((ex) => ex.id === q.id || ex.question.toLowerCase() === q.question.toLowerCase())) {
        accumulatedQuestions.push(q);
      }
    }
  }

  if (accumulatedQuestions.length >= targetCount) {
    return accumulatedQuestions.slice(0, targetCount);
  }

  // Final safety check: if still short, generate fresh non-duplicate questions
  const finalPool = getFallbackPool(targetCount);
  return finalPool.slice(0, targetCount);
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

export interface WeakTopicInfo {
  topic: string;
  chapter?: string;
  accuracy: number;
  scorePercentage?: number;
  totalAttempts: number;
  attempts?: number;
}

export function getWeakTopicsForStudent(
  subject?: string,
  board?: string,
  grade?: string
): WeakTopicInfo[] {
  try {
    const history = getSelfTestHistory();
    const topicStats: Record<string, { correct: number; total: number; chapter?: string }> = {};

    for (const test of history) {
      const cfg = test.config;
      if (!cfg) continue;
      if (subject && cfg.subject && cfg.subject.toLowerCase() !== subject.toLowerCase()) continue;
      if (board && cfg.board && cfg.board.toLowerCase() !== board.toLowerCase()) continue;
      if (grade && cfg.grade && cfg.grade.toString() !== grade.toString()) continue;

      const topicKey = cfg.topic || 'General';
      if (!topicStats[topicKey]) {
        topicStats[topicKey] = { correct: 0, total: 0, chapter: cfg.topic };
      }

      topicStats[topicKey].correct += (test.score || 0);
      topicStats[topicKey].total += (test.totalQuestions || 0);
    }

    const result: WeakTopicInfo[] = [];
    for (const [topic, stats] of Object.entries(topicStats)) {
      if (stats.total >= 3) {
        const accuracy = Math.round((stats.correct / stats.total) * 100);
        if (accuracy < 70) {
          result.push({
            topic,
            chapter: stats.chapter,
            accuracy,
            scorePercentage: accuracy,
            totalAttempts: stats.total,
            attempts: stats.total,
          });
        }
      }
    }

    return result.sort((a, b) => a.accuracy - b.accuracy);
  } catch (err) {
    console.error('Error calculating weak topics:', err);
    return [];
  }
}

