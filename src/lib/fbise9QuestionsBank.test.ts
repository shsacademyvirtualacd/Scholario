import { describe, it, expect } from 'vitest';
import { getGrade9FBISEQuestions, FBISE_9_QUESTION_BANK } from './fbise9QuestionsBank';

describe('getGrade9FBISEQuestions', () => {
  it('should retrieve questions for a valid subject (Physics)', () => {
    const questions = getGrade9FBISEQuestions('Physics');
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(10); // default count = 10
    expect(questions[0]).toHaveProperty('id');
    expect(questions[0]).toHaveProperty('question');
    expect(questions[0]).toHaveProperty('options');
    expect(questions[0]).toHaveProperty('correctAnswer');
  });

  it('should handle subject normalization with subject aliases (e.g., "phy")', () => {
    const questionsFromAlias = getGrade9FBISEQuestions('phy', [], 5);
    const questionsFromFull = getGrade9FBISEQuestions('Physics', [], 5);

    expect(questionsFromAlias.length).toBeGreaterThan(0);
    expect(questionsFromAlias.length).toBeLessThanOrEqual(5);
    expect(questionsFromFull.length).toBeGreaterThan(0);
  });

  it('should handle case-insensitive subject names (e.g., "pHySiCs")', () => {
    const questions = getGrade9FBISEQuestions('pHySiCs', [], 5);
    expect(questions.length).toBeGreaterThan(0);
  });

  it('should return an empty array for an unknown subject', () => {
    const questions = getGrade9FBISEQuestions('UnknownSubject123');
    expect(questions).toEqual([]);
  });

  it('should filter questions by exact chapter match', () => {
    const physicsBank = FBISE_9_QUESTION_BANK['Physics'] || {};
    const chapterNames = Object.keys(physicsBank);
    if (chapterNames.length > 0) {
      const targetChapter = chapterNames[0];
      const questions = getGrade9FBISEQuestions('Physics', [targetChapter], 50);

      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(physicsBank[targetChapter].length);
    }
  });

  it('should filter questions by partial chapter match', () => {
    // e.g., 'Kinematics' or 'Measurement'
    const questions = getGrade9FBISEQuestions('Physics', ['Kinematics'], 50);
    expect(questions.length).toBeGreaterThan(0);
  });

  it('should treat "Full Syllabus", "Mixed Chapters", "All", or empty array as selecting all chapters', () => {
    const qFull = getGrade9FBISEQuestions('Physics', ['Full Syllabus'], 50);
    const qMixed = getGrade9FBISEQuestions('Physics', ['Mixed Chapters'], 50);
    const qAll = getGrade9FBISEQuestions('Physics', ['All'], 50);
    const qEmpty = getGrade9FBISEQuestions('Physics', [], 50);

    expect(qFull.length).toBeGreaterThan(0);
    expect(qMixed.length).toBeGreaterThan(0);
    expect(qAll.length).toBeGreaterThan(0);
    expect(qEmpty.length).toBeGreaterThan(0);
  });

  it('should return empty array for a non-existent chapter name', () => {
    const questions = getGrade9FBISEQuestions('Physics', ['NonExistentChapterXYZ999']);
    expect(questions).toEqual([]);
  });

  it('should respect the count parameter limit', () => {
    const count3 = getGrade9FBISEQuestions('Physics', [], 3);
    expect(count3.length).toBeLessThanOrEqual(3);

    const count1 = getGrade9FBISEQuestions('Physics', [], 1);
    expect(count1.length).toBe(1);
  });

  it('should exclude questions specified in excludeTexts (case-insensitive and trimmed)', () => {
    const initialQuestions = getGrade9FBISEQuestions('Physics', [], 5);
    expect(initialQuestions.length).toBeGreaterThan(0);

    const textToExclude = initialQuestions[0].question;
    const excludedQuestions = getGrade9FBISEQuestions('Physics', [], 50, 'medium', [
      `  ${textToExclude.toUpperCase()}  `,
    ]);

    const foundExcluded = excludedQuestions.some(
      (q) => q.question.trim().toLowerCase() === textToExclude.trim().toLowerCase()
    );
    expect(foundExcluded).toBe(false);
  });

  it('should map question properties correctly with topic and difficulty fallbacks', () => {
    const questions = getGrade9FBISEQuestions('Physics', [], 5, 'hard');
    expect(questions.length).toBeGreaterThan(0);

    for (const q of questions) {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('question');
      expect(q).toHaveProperty('options');
      expect(q).toHaveProperty('correctAnswer');
      expect(q).toHaveProperty('explanation');
      expect(q).toHaveProperty('difficulty');
      expect(q).toHaveProperty('topic');
      expect(typeof q.topic).toBe('string');
      expect(q.topic?.length).toBeGreaterThan(0);
    }
  });
});
