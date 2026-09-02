// Script to assemble and write 500 IELTS Grammar MCQs into src/data/banks/ielts/grammar.ts
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const d1 = require('./grammarData1.cjs');
const d2 = require('./grammarData2.cjs');
const d3 = require('./grammarData3.cjs');
const d4 = require('./grammarData4.cjs');

const allPool = [...d1, ...d2, ...d3, ...d4];

// Select exactly 500 questions
const selected = allPool.slice(0, 500);

// Distribute correct answers evenly across A, B, C, D (target: 125 each)
const letters = ['A', 'B', 'C', 'D'];

const processed = selected.map((q, index) => {
  const targetAnswer = letters[index % 4];
  const origAnswer = q.correctAnswer;
  const origIndex = letters.indexOf(origAnswer);
  const targetIndex = letters.indexOf(targetAnswer);

  let newOptions = [...q.options];
  
  if (origIndex !== targetIndex && origIndex !== -1 && targetIndex !== -1) {
    // Swap original correct option with target option position
    const temp = newOptions[targetIndex];
    newOptions[targetIndex] = newOptions[origIndex];
    newOptions[origIndex] = temp;
  }

  const id = `ielts-gram-${String(index + 1).padStart(3, '0')}`;

  return {
    id,
    question: q.question,
    options: newOptions,
    correctAnswer: targetAnswer,
    explanation: q.explanation,
    difficulty: q.difficulty || 'medium',
    chapter: 'Grammar',
    topic: q.topic || 'General Grammar'
  };
});

// Verification stats
const stats = {
  total: processed.length,
  answers: {},
  topics: {},
  difficulties: {}
};

processed.forEach(q => {
  stats.answers[q.correctAnswer] = (stats.answers[q.correctAnswer] || 0) + 1;
  stats.topics[q.topic] = (stats.topics[q.topic] || 0) + 1;
  stats.difficulties[q.difficulty] = (stats.difficulties[q.difficulty] || 0) + 1;
});

console.log('--- 500 IELTS Grammar Bank Generated ---');
console.log('Total Questions:', stats.total);
console.log('Answer Distribution:', stats.answers);
console.log('Topics Breakdown:', stats.topics);
console.log('Difficulty Breakdown:', stats.difficulties);

// Output to src/data/banks/ielts/grammar.ts
const fileHeader = `/**
 * IELTS 500-Question Authoritative Grammar MCQ Bank
 * Comprehensive syllabus covering:
 * - Subject-Verb Agreement
 * - Tenses, Aspect & Time Clauses
 * - Conditionals & Unreal Past
 * - Passive Voice & Causatives
 * - Relative Clauses & Participles
 * - Modals & Past Deduction
 * - Articles & Quantifiers
 * - Prepositions, Collocations & Phrasal Verbs
 * - Inversion, Fronting & Subjunctive
 * - Conjunctions & Sentence Structure
 * - Punctuation & Syntax Mechanics
 * - Error Identification & Sentence Correction
 */

export interface RawIELTSMCQ {
  id: string;
  question: string;
  options: string[] | { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'board_exam' | string;
  topic?: string;
  chapter?: string;
  passage?: string;
}

export type StoredMCQ = RawIELTSMCQ;

// ==========================================
// 500 GRAMMAR MCQS (SYLLABUS & IELTS ACCURATE)
// ==========================================
export const IELTS_GRAMMAR_MCQS: RawIELTSMCQ[] = ${JSON.stringify(processed, null, 2)};
`;

const outputPath = path.resolve(process.cwd(), 'src/data/banks/ielts/grammar.ts');
fs.writeFileSync(outputPath, fileHeader, 'utf-8');
console.log('Successfully written 500 questions to:', outputPath);
