import type { MCQQuestion, SelfTestConfig, SelfTestResult } from '../types/selfTest';

const SELF_TEST_HISTORY_KEY = 'scholario_self_test_history_v1';

export async function generateMCQTest(config: SelfTestConfig): Promise<MCQQuestion[]> {
  try {
    const response = await fetch('/api/tests/generate-mcq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = (await response.json()) as { questions?: MCQQuestion[] };
    if (data && Array.isArray(data.questions) && data.questions.length > 0) {
      return data.questions;
    }

    throw new Error('No questions returned from generator');
  } catch (err: any) {
    console.error('Failed to generate MCQs via API:', err);
    throw err;
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
