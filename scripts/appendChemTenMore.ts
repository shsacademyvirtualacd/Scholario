import fs from 'fs';
import path from 'path';
import { CHEM_CHAPTERS_1_TO_10 } from './data/chemTenMoreDataPart1';
import { CHEM_CHAPTERS_11_TO_19 } from './data/chemTenMoreDataPart2';
import { validateMCQQuestion, checkQuestionDuplicate, calculateQuestionSimilarity } from '../src/lib/mcqValidator';
import type { StoredMCQ } from '../src/types/questionBank';

const JSON_PATH = path.resolve(process.cwd(), 'src/data/grade9FbiseBank.json');
const TS_PATH = path.resolve(process.cwd(), 'src/lib/fbise9QuestionsBank.ts');

const ALL_NEW_CHEM_QUESTIONS: Record<string, StoredMCQ[]> = {
  ...CHEM_CHAPTERS_1_TO_10,
  ...CHEM_CHAPTERS_11_TO_19,
};

async function run() {
  console.log('========================================================');
  console.log('=== Grade 9 FBISE Chemistry: Append 10 MCQs/Chapter ===');
  console.log('========================================================\n');

  // Step 1: Verify all 19 chapters are present in new batch
  const chapterKeys = Object.keys(ALL_NEW_CHEM_QUESTIONS);
  console.log(`Step 1: Checking chapters in new batch (${chapterKeys.length} chapters)...`);
  if (chapterKeys.length !== 19) {
    throw new Error(`Expected 19 chapters in new batch, but got ${chapterKeys.length}!`);
  }

  let totalNewCount = 0;
  const newIds = new Set<string>();

  for (let chNum = 1; chNum <= 19; chNum++) {
    const chName = chapterKeys[chNum - 1];
    const qList = ALL_NEW_CHEM_QUESTIONS[chName];
    if (!qList || qList.length !== 10) {
      throw new Error(`Chapter #${chNum} "${chName}" has ${qList ? qList.length : 0} questions (expected 10)!`);
    }
    totalNewCount += qList.length;

    // Check each question
    qList.forEach((q, idx) => {
      const expectedId = `fbise9_chem_${chNum}_${21 + idx}`;
      if (q.id !== expectedId) {
        throw new Error(`Question ID mismatch: expected ${expectedId}, got ${q.id}`);
      }
      if (newIds.has(q.id)) {
        throw new Error(`Duplicate question ID detected: ${q.id}`);
      }
      newIds.add(q.id);

      // Validate schema and quality
      const validation = validateMCQQuestion(q, {
        subject: 'Chemistry',
        topic: chName,
        grade: '9',
        board: 'fbise'
      });
      if (!validation.valid) {
        throw new Error(`Validation failed for ${q.id}: ${validation.reason}`);
      }
    });
  }
  console.log(`✓ Validated all ${totalNewCount} new MCQs across 19 chapters.`);

  // Step 2: Read existing JSON bank
  console.log('\nStep 2: Reading existing JSON question bank...');
  const rawJson = fs.readFileSync(JSON_PATH, 'utf-8');
  const bankJson = JSON.parse(rawJson);

  if (!bankJson['Chemistry']) {
    throw new Error('Chemistry subject missing in JSON bank!');
  }

  const existingChem = bankJson['Chemistry'];
  const existingChemChapters = Object.keys(existingChem);
  console.log(`Found ${existingChemChapters.length} existing Chemistry chapters.`);

  if (existingChemChapters.length !== 19) {
    throw new Error(`Expected 19 existing Chemistry chapters, got ${existingChemChapters.length}`);
  }

  let originalChemCount = 0;
  const existingChemIds = new Set<string>();

  for (const ch of existingChemChapters) {
    const qList = existingChem[ch];
    if (qList.length !== 20) {
      throw new Error(`Chapter "${ch}" currently has ${qList.length} MCQs (expected 20)!`);
    }
    originalChemCount += qList.length;
    for (const q of qList) {
      if (existingChemIds.has(q.id)) {
        throw new Error(`Duplicate existing ID: ${q.id}`);
      }
      existingChemIds.add(q.id);
    }
  }

  console.log(`✓ Verified existing Chemistry count = ${originalChemCount} (20 per chapter).`);
  if (originalChemCount !== 380) {
    throw new Error(`Expected 380 existing Chemistry questions, found ${originalChemCount}`);
  }

  // Step 3: Duplicate & similarity check between new and existing questions
  console.log('\nStep 3: Checking uniqueness against existing questions...');
  for (const chName of chapterKeys) {
    const newQs = ALL_NEW_CHEM_QUESTIONS[chName];
    const existingQs = existingChem[chName];

    for (const nq of newQs) {
      for (const eq of existingQs) {
        const dup = checkQuestionDuplicate(nq, [eq]);
        if (dup.isDuplicate) {
          throw new Error(`Duplicate detected between new ${nq.id} and existing ${eq.id}: ${dup.reason}`);
        }
        const sim = calculateQuestionSimilarity(nq.question, eq.question);
        if (sim.similarity > 0.88 || sim.isTemplateDuplicate) {
          throw new Error(`High similarity (${sim.similarity.toFixed(2)}) between new ${nq.id} and existing ${eq.id}`);
        }
      }
    }
  }
  console.log('✓ All 190 new questions are distinct and unique.');

  // Step 4: Strict append-only update to JSON bank
  console.log('\nStep 4: Performing strict append-only merge to grade9FbiseBank.json...');
  const updatedBank = JSON.parse(JSON.stringify(bankJson));

  for (const chName of chapterKeys) {
    const existingList = updatedBank['Chemistry'][chName];
    const newQs = ALL_NEW_CHEM_QUESTIONS[chName];
    updatedBank['Chemistry'][chName] = [...existingList, ...newQs];
  }

  // Verify non-Chemistry subjects untouched
  for (const subj of Object.keys(bankJson)) {
    if (subj === 'Chemistry') continue;
    const origSubjStr = JSON.stringify(bankJson[subj]);
    const newSubjStr = JSON.stringify(updatedBank[subj]);
    if (origSubjStr !== newSubjStr) {
      throw new Error(`Subject "${subj}" was modified during append! Strict isolation violated.`);
    }
  }
  console.log('✓ Verified all other subjects (Physics, Biology, Mathematics, Urdu, Islamiat) are 100% untouched.');

  // Verify final Chemistry count in JSON
  let finalJsonChemCount = 0;
  for (const ch of Object.keys(updatedBank['Chemistry'])) {
    const count = updatedBank['Chemistry'][ch].length;
    if (count !== 30) {
      throw new Error(`Chapter "${ch}" has ${count} questions (expected 30)!`);
    }
    finalJsonChemCount += count;
  }
  console.log(`✓ JSON Bank Chemistry count: ${finalJsonChemCount} (30 per chapter across 19 chapters).`);
  if (finalJsonChemCount !== 570) {
    throw new Error(`Expected 570 total Chemistry questions, got ${finalJsonChemCount}`);
  }

  // Write to JSON file
  fs.writeFileSync(JSON_PATH, JSON.stringify(updatedBank, null, 2), 'utf-8');
  console.log(`✓ Successfully updated ${JSON_PATH}`);

  // Step 5: Update TypeScript question bank file fbise9QuestionsBank.ts
  console.log('\nStep 5: Updating TypeScript question bank file src/lib/fbise9QuestionsBank.ts...');
  
  // Format the full bank object for the TS file
  const tsContent = `// Auto-generated FBISE Grade 9 Question Bank
import type { MCQQuestion, MCQDifficulty } from '../types/selfTest';

export const FBISE_9_QUESTION_BANK: Record<string, Record<string, MCQQuestion[]>> = ${JSON.stringify(updatedBank, null, 2)};

export function getFbise9QuestionCount(subject?: string): number {
  if (subject && FBISE_9_QUESTION_BANK[subject]) {
    return Object.values(FBISE_9_QUESTION_BANK[subject]).reduce(
      (sum, list) => sum + list.length,
      0
    );
  }
  return Object.values(FBISE_9_QUESTION_BANK).reduce(
    (subjSum, chapters) =>
      subjSum +
      Object.values(chapters).reduce((chSum, list) => chSum + list.length, 0),
    0
  );
}

export function getFbise9QuestionsByChapter(
  subject: string,
  chapter: string
): MCQQuestion[] {
  return FBISE_9_QUESTION_BANK[subject]?.[chapter] || [];
}

export function getRandomFbise9Questions(
  subject: string,
  chapter: string,
  count: number,
  difficulty?: MCQDifficulty | 'mixed'
): MCQQuestion[] {
  const all = getFbise9QuestionsByChapter(subject, chapter);
  let pool = all;
  if (difficulty && difficulty !== 'mixed') {
    const diffFiltered = pool.filter((q) => q.difficulty === difficulty);
    if (diffFiltered.length >= count) {
      pool = diffFiltered;
    }
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
`;

  fs.writeFileSync(TS_PATH, tsContent, 'utf-8');
  console.log(`✓ Successfully updated ${TS_PATH}`);

  console.log('\n========================================================');
  console.log('=== APPEND-ONLY TASK COMPLETED SUCCESSFULLY ===');
  console.log(`Chemistry Final: 570 MCQs (30 per chapter across 19 chapters)`);
  console.log('========================================================');
}

run().catch((err) => {
  console.error('Error during execution:', err);
  process.exit(1);
});
