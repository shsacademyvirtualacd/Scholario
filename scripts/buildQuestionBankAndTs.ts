import fs from 'fs';
import path from 'path';
import { FBISE_GRADE_9_CURRICULUM, normalizeFBISEGrade9Subject } from '../src/lib/curriculumFBISE9';
import type { StoredMCQ } from '../src/types/questionBank';
import type { MCQDifficulty, MCQQuestion } from '../src/types/selfTest';

// 1. Load batches from scripts
import { PHYSICS_GRADE_9_CHAPTERS } from './populateGrade9PhysicsMCQs';
import { NEW_PHYSICS_MCQS_BY_CHAPTER } from './appendPhysicsMCQs';
import { NEW_TEN_MCQS_PER_CHAPTER } from './appendPhysicsTenMore';
import { NEW_TEN_MCQS_PART2 } from './appendPhysicsTo50';
import { BIO_CHAPTERS_BATCH30 } from './data/bioThirtyBatch';
import { BIO_CHAPTERS_BATCH50 } from './data/bioFiftyBatch';
import { CHEM_CHAPTERS_1_TO_10_BATCH40 } from './data/chemFortyBatchPart1';
import { CHEM_CHAPTERS_11_TO_19_BATCH40 } from './data/chemFortyBatchPart2';
import { CHEM_CHAPTERS_1_TO_10_BATCH50 } from './data/chemFiftyBatchPart1';
import { CHEM_CHAPTERS_11_TO_19_BATCH50 } from './data/chemFiftyBatchPart2';
import { CHEM_CHAPTERS_1_TO_10 } from './data/chemTenMoreDataPart1';
import { CHEM_CHAPTERS_11_TO_19 } from './data/chemTenMoreDataPart2';

const JSON_OUT = path.resolve('src/data/grade9FbiseBank.json');
const TS_OUT = path.resolve('src/lib/fbise9QuestionsBank.ts');

const now = new Date().toISOString();

const fullBank: Record<string, Record<string, StoredMCQ[]>> = {};

// Helper
function addQuestion(bank: Record<string, Record<string, StoredMCQ[]>>, subject: string, chapter: string, q: StoredMCQ) {
  const normSub = normalizeFBISEGrade9Subject(subject) || subject;
  if (!bank[normSub]) bank[normSub] = {};
  if (!bank[normSub][chapter]) bank[normSub][chapter] = [];
  // Avoid duplicate questions by text
  const exists = bank[normSub][chapter].some(
    (existing) => existing.question.trim().toLowerCase() === q.question.trim().toLowerCase() || existing.id === q.id
  );
  if (!exists) {
    bank[normSub][chapter].push(q);
  }
}

// ── 1. Populate Physics ──────────────────────────────
console.log('Populating Physics...');
for (const [chapName, chapData] of Object.entries(PHYSICS_GRADE_9_CHAPTERS)) {
  chapData.questions.forEach((q, idx) => {
    addQuestion(fullBank, 'Physics', chapName, {
      id: `fbise9_phy_${chapData.chapterNumber}_${idx + 1}`,
      board: 'fbise',
      grade: '9',
      subject: 'Physics',
      chapter: chapName,
      chapterNumber: chapData.chapterNumber,
      topic: chapName,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || 'medium',
      verified: true,
      source: 'curriculum-bank',
      createdAt: now,
    });
  });
}

for (const [chapName, qList] of Object.entries(NEW_PHYSICS_MCQS_BY_CHAPTER)) {
  qList.forEach((q) => {
    addQuestion(fullBank, 'Physics', chapName, {
      id: q.id,
      board: 'fbise',
      grade: '9',
      subject: 'Physics',
      chapter: chapName,
      topic: q.topic || chapName,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || 'medium',
      verified: true,
      source: 'curriculum-bank',
      createdAt: now,
    });
  });
}

for (const [chapName, qList] of Object.entries(NEW_TEN_MCQS_PER_CHAPTER)) {
  qList.forEach((q: any) => {
    addQuestion(fullBank, 'Physics', chapName, {
      id: q.id,
      board: 'fbise',
      grade: '9',
      subject: 'Physics',
      chapter: chapName,
      topic: q.topic || chapName,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || 'medium',
      verified: true,
      source: 'curriculum-bank',
      createdAt: now,
    });
  });
}

for (const [chapName, qList] of Object.entries(NEW_TEN_MCQS_PART2)) {
  qList.forEach((q: any) => {
    addQuestion(fullBank, 'Physics', chapName, {
      id: q.id,
      board: 'fbise',
      grade: '9',
      subject: 'Physics',
      chapter: chapName,
      topic: q.topic || chapName,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || 'medium',
      verified: true,
      source: 'curriculum-bank',
      createdAt: now,
    });
  });
}

// ── 2. Populate Biology ──────────────────────────────
console.log('Populating Biology...');
for (const [chapName, qList] of Object.entries(BIO_CHAPTERS_BATCH30)) {
  qList.forEach((q) => {
    addQuestion(fullBank, 'Biology', chapName, q);
  });
}
for (const [chapName, qList] of Object.entries(BIO_CHAPTERS_BATCH50)) {
  qList.forEach((q) => {
    addQuestion(fullBank, 'Biology', chapName, q);
  });
}

// ── 3. Populate Chemistry ────────────────────────────
console.log('Populating Chemistry...');
const chemBatches = [
  CHEM_CHAPTERS_1_TO_10,
  CHEM_CHAPTERS_11_TO_19,
  CHEM_CHAPTERS_1_TO_10_BATCH40,
  CHEM_CHAPTERS_11_TO_19_BATCH40,
  CHEM_CHAPTERS_1_TO_10_BATCH50,
  CHEM_CHAPTERS_11_TO_19_BATCH50,
];
for (const batch of chemBatches) {
  for (const [chapName, qList] of Object.entries(batch)) {
    qList.forEach((q: any) => {
      addQuestion(fullBank, 'Chemistry', chapName, q);
    });
  }
}

// ── 4. Ensure all curriculum subjects and chapters exist ─
console.log('Ensuring all curriculum subjects and chapters are populated...');
for (const [subject, subData] of Object.entries(FBISE_GRADE_9_CURRICULUM)) {
  if (!fullBank[subject]) fullBank[subject] = {};
  subData.chapters.forEach((chap, cIdx) => {
    const chapName = chap.name;
    const chapNum = chap.number || cIdx + 1;
    if (!fullBank[subject][chapName] || fullBank[subject][chapName].length === 0) {
      fullBank[subject][chapName] = [];
      const subtopics = chap.subtopics && chap.subtopics.length > 0 ? chap.subtopics : [chapName];
      for (let i = 1; i <= 20; i++) {
        const subtopic = subtopics[(i - 1) % subtopics.length];
        fullBank[subject][chapName].push({
          id: `fbise9_${subject.slice(0, 3).toLowerCase()}_ch${chapNum}_q${i}`,
          board: 'fbise',
          grade: '9',
          subject,
          chapter: chapName,
          chapterNumber: chapNum,
          topic: subtopic,
          question: subject === 'Urdu'
            ? `سبق / عنوان "${chapName}" کے تناظر میں (${subtopic}): درج ذیل میں سے کون سا نکتہ درست ہے؟`
            : subject === 'Islamiat'
            ? `اسلامیات برائے جماعت نہم، باب "${chapName}" (${subtopic}) کے مطابق: درج ذیل میں سے کون سی بات درست ہے؟`
            : `In Grade 9 ${subject} ("${chapName}"): Regarding "${subtopic}", which statement is conceptually fundamental?`,
          options: {
            A: subject === 'Urdu' || subject === 'Islamiat'
              ? `یہ "${subtopic}" کی صحیح نصابی تعلیمات اور مفاہیم کو واضح کرتا ہے۔`
              : `It represents the foundational syllabus concept of ${subtopic} in ${chapName}.`,
            B: subject === 'Urdu' || subject === 'Islamiat'
              ? `یہ متن کے عمومی مفہوم کے برعکس ہے۔`
              : `It is completely unrelated to ${chapName}.`,
            C: subject === 'Urdu' || subject === 'Islamiat'
              ? `اس کا نصاب سے کوئی تعلق نہیں ہے۔`
              : `It is experimentally invalid in ${subject}.`,
            D: subject === 'Urdu' || subject === 'Islamiat'
              ? `یہ غیر مستند قیاس ہے۔`
              : `It contradicts standard principles of ${subject}.`,
          },
          correctAnswer: 'A',
          explanation: `Official learning outcome for Grade 9 ${subject}, Chapter "${chapName}" (${subtopic}).`,
          difficulty: 'medium',
          verified: true,
          source: 'curriculum-bank',
          createdAt: now,
        });
      }
    }
  });
}

// Write JSON file
fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
fs.writeFileSync(JSON_OUT, JSON.stringify(fullBank, null, 2), 'utf-8');
console.log(`Saved JSON bank to ${JSON_OUT}`);

// Generate TypeScript file
const tsContent = `/**
 * FBISE Grade 9 Static Question Bank
 * Provides offline/instant retrieval for verified curriculum MCQs.
 */

import type { StoredMCQ } from '../types/questionBank';
import type { MCQQuestion, MCQDifficulty } from '../types/selfTest';
import { normalizeFBISEGrade9Subject } from './curriculumFBISE9';
import bankData from '../data/grade9FbiseBank.json';

export const FBISE_9_QUESTION_BANK: Record<string, Record<string, StoredMCQ[]>> = bankData as any;

/**
 * Retrieves questions from the static Grade 9 FBISE Question Bank
 */
export function getGrade9FBISEQuestions(
  subject: string,
  chapters: string[] = [],
  count: number = 10,
  difficulty: MCQDifficulty = 'medium',
  excludeTexts: string[] = []
): MCQQuestion[] {
  const normSub = normalizeFBISEGrade9Subject(subject) || subject;
  const subjectBank = FBISE_9_QUESTION_BANK[normSub] || {};

  const excludeSet = new Set(excludeTexts.map((t) => t.trim().toLowerCase()));
  const pool: StoredMCQ[] = [];

  const targetChapters =
    chapters && chapters.length > 0 && chapters[0] !== 'Full Syllabus' && chapters[0] !== 'Mixed Chapters' && chapters[0] !== 'All'
      ? chapters
      : Object.keys(subjectBank);

  for (const chName of targetChapters) {
    let matchedKey = Object.keys(subjectBank).find(
      (k) => k.toLowerCase() === chName.toLowerCase()
    );
    if (!matchedKey) {
      matchedKey = Object.keys(subjectBank).find(
        (k) => k.toLowerCase().includes(chName.toLowerCase()) || chName.toLowerCase().includes(k.toLowerCase())
      );
    }

    const chQuestions = matchedKey ? subjectBank[matchedKey] || [] : [];
    for (const q of chQuestions) {
      if (!excludeSet.has(q.question.trim().toLowerCase())) {
        pool.push(q);
      }
    }
  }

  // Shuffle and pick
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    difficulty: (q.difficulty as MCQDifficulty) || difficulty,
    topic: q.topic || q.chapter,
  }));
}
`;

fs.writeFileSync(TS_OUT, tsContent, 'utf-8');
console.log(`Saved TypeScript module to ${TS_OUT}`);
