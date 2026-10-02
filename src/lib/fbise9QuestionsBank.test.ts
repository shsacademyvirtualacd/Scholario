import { describe, it, expect } from 'vitest';
import { getGrade9FBISEQuestions, FBISE_9_QUESTION_BANK } from './fbise9QuestionsBank';

describe('getGrade9FBISEQuestions', () => {
  it('should return questions with default parameters for a valid subject', () => {
    const questions = getGrade9FBISEQuestions('Physics');
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(10);

    const first = questions[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('question');
    expect(first).toHaveProperty('options');
    expect(first).toHaveProperty('correctAnswer');
    expect(first).toHaveProperty('difficulty');
    expect(first).toHaveProperty('topic');
  });

  it('should resolve subject aliases (e.g. "phy", "chem", "math")', () => {
    const phyQuestions = getGrade9FBISEQuestions('phy');
    expect(phyQuestions.length).toBeGreaterThan(0);

    const chemQuestions = getGrade9FBISEQuestions('chem');
    expect(chemQuestions.length).toBeGreaterThan(0);

    const mathQuestions = getGrade9FBISEQuestions('math');
    expect(mathQuestions.length).toBeGreaterThan(0);
  });

  it('should return an empty array for unknown or invalid subject', () => {
    const questions = getGrade9FBISEQuestions('UnknownSubject123');
    expect(questions).toEqual([]);
  });

  it('should select all chapters when chapters array is empty or contains "Full Syllabus", "Mixed Chapters", or "All"', () => {
    const defaultQuestions = getGrade9FBISEQuestions('Physics', []);
    const fullSyllabusQuestions = getGrade9FBISEQuestions('Physics', ['Full Syllabus']);
    const mixedQuestions = getGrade9FBISEQuestions('Physics', ['Mixed Chapters']);
    const allQuestions = getGrade9FBISEQuestions('Physics', ['All']);

    expect(defaultQuestions.length).toBeGreaterThan(0);
    expect(fullSyllabusQuestions.length).toBeGreaterThan(0);
    expect(mixedQuestions.length).toBeGreaterThan(0);
    expect(allQuestions.length).toBeGreaterThan(0);
  });

  it('should filter questions by explicit chapter name (exact match)', () => {
    const subjectBank = FBISE_9_QUESTION_BANK['Physics'] || {};
    const chapterKeys = Object.keys(subjectBank);

    if (chapterKeys.length > 0) {
      const targetChapter = chapterKeys[0];
      const questions = getGrade9FBISEQuestions('Physics', [targetChapter], 50);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(subjectBank[targetChapter].length);
    }
  });

  it('should match chapter using partial case-insensitive string matching', () => {
    const subjectBank = FBISE_9_QUESTION_BANK['Physics'] || {};
    const chapterKeys = Object.keys(subjectBank);

    if (chapterKeys.length > 0) {
      // Pick a substring from a chapter key
      const targetKey = chapterKeys[0];
      const partialSub = targetKey.substring(0, Math.min(4, targetKey.length)).toLowerCase();

      const questions = getGrade9FBISEQuestions('Physics', [partialSub], 50);
      expect(questions.length).toBeGreaterThan(0);
    }
  });

  it('should return an empty array if chapter is non-existent and does not match any chapter in the bank', () => {
    const questions = getGrade9FBISEQuestions('Physics', ['NonExistentChapterKey_999']);
    expect(questions).toEqual([]);
  });

  it('should exclude questions specified in excludeTexts (case-insensitive and trimmed)', () => {
    const allQuestions = getGrade9FBISEQuestions('Physics', [], 50);
    expect(allQuestions.length).toBeGreaterThan(0);

    const questionToExclude = allQuestions[0].question;
    const paddedQuestion = `   ${questionToExclude.toUpperCase()}   `;

    const filteredQuestions = getGrade9FBISEQuestions('Physics', [], 50, 'medium', [paddedQuestion]);
    const foundExcluded = filteredQuestions.some((q) => q.question.trim().toLowerCase() === questionToExclude.trim().toLowerCase());

    expect(foundExcluded).toBe(false);
  });

  it('should respect requested count parameter', () => {
    const countZero = getGrade9FBISEQuestions('Physics', [], 0);
    expect(countZero).toEqual([]);

    const countThree = getGrade9FBISEQuestions('Physics', [], 3);
    expect(countThree.length).toBeLessThanOrEqual(3);

    const countHuge = getGrade9FBISEQuestions('Physics', [], 10000);
    const totalInBank = Object.values(FBISE_9_QUESTION_BANK['Physics'] || {}).reduce((acc, curr) => acc + curr.length, 0);
    expect(countHuge.length).toBe(totalInBank);
  });

  it('should assign difficulty fallback when item difficulty is missing', () => {
    // Test with mock bank entry where difficulty is missing
    const originalPhysicsBank = FBISE_9_QUESTION_BANK['Physics'];
    try {
      FBISE_9_QUESTION_BANK['Physics'] = {
        'ch_test': [
          {
            id: 'mock_q1',
            question: 'Mock Question 1',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A',
            chapter: 'Test Chapter',
            explanation: 'Mock explanation'
          } as any
        ]
      };

      const result = getGrade9FBISEQuestions('Physics', ['ch_test'], 1, 'hard');
      expect(result.length).toBe(1);
      expect(result[0].difficulty).toBe('hard');
      expect(result[0].topic).toBe('Test Chapter');
    } finally {
      FBISE_9_QUESTION_BANK['Physics'] = originalPhysicsBank;
    }
  });

  it('should use item topic or fallback to item chapter for topic property', () => {
    const originalPhysicsBank = FBISE_9_QUESTION_BANK['Physics'];
    try {
      FBISE_9_QUESTION_BANK['Physics'] = {
        'ch_test': [
          {
            id: 'mock_q1',
            question: 'Mock Question Topic',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A',
            topic: 'Explicit Topic',
            chapter: 'Test Chapter',
            difficulty: 'easy'
          } as any,
          {
            id: 'mock_q2',
            question: 'Mock Question Chapter Fallback',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'B',
            chapter: 'Fallback Chapter',
            difficulty: 'easy'
          } as any
        ]
      };

      const result = getGrade9FBISEQuestions('Physics', ['ch_test'], 10, 'easy');
      expect(result.length).toBe(2);

      const q1 = result.find((q) => q.id === 'mock_q1');
      const q2 = result.find((q) => q.id === 'mock_q2');

      expect(q1?.topic).toBe('Explicit Topic');
      expect(q2?.topic).toBe('Fallback Chapter');
    } finally {
      FBISE_9_QUESTION_BANK['Physics'] = originalPhysicsBank;
    }
  });
});
