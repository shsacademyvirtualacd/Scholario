import fs from 'fs';
import path from 'path';
import { FBISE_9_QUESTION_BANK } from '../src/lib/fbise9QuestionsBank';
import { validateMCQQuestion, checkQuestionDuplicate } from '../src/lib/mcqValidator';

async function verify() {
  console.log('--- Starting Comprehensive Bank Verification ---');

  // 1. Check TypeScript Static Bank
  console.log('\n[1] Verifying TypeScript Static Bank (FBISE_9_QUESTION_BANK):');
  const phyChapters = Object.keys(FBISE_9_QUESTION_BANK.Physics || {});
  console.log(`Physics Chapters in TS bank: ${phyChapters.length}`);

  let totalTsPhysicsQuestions = 0;
  const tsAllIds = new Set<string>();

  for (const ch of phyChapters) {
    const questions = FBISE_9_QUESTION_BANK.Physics[ch];
    totalTsPhysicsQuestions += questions.length;
    console.log(`  - [${ch}]: ${questions.length} questions`);

    if (questions.length !== 40) {
      throw new Error(`Expected 40 questions in TS bank for chapter "${ch}", found ${questions.length}`);
    }

    for (const q of questions) {
      if (tsAllIds.has(q.id)) {
        throw new Error(`Duplicate ID found in TS bank: ${q.id}`);
      }
      tsAllIds.add(q.id);

      // Validate options
      if (!q.options || !q.options.A || !q.options.B || !q.options.C || !q.options.D) {
        throw new Error(`Missing options in question ${q.id}`);
      }

      if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
        throw new Error(`Invalid correct answer in question ${q.id}: ${q.correctAnswer}`);
      }
    }
  }

  console.log(`Total Physics MCQs in TS Bank: ${totalTsPhysicsQuestions} (Expected 360)`);

  // 2. Check JSON Bank
  console.log('\n[2] Verifying JSON Bank (grade9FbiseBank.json):');
  const jsonPath = path.resolve(process.cwd(), 'src/data/grade9FbiseBank.json');
  const jsonBank = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const jsonPhyKeys = [
    'Physical Quantities and Measurement',
    'Kinematics',
    'Dynamics – I',
    'Dynamics – II',
    'Pressure and Deformation in Solids',
    'Work and Energy',
    'Density and Temperature',
    'Magnetism',
    'Nature of Science and Physics',
  ];

  let totalJsonPhy = 0;
  const jsonAllIds = new Set<string>();

  for (const ch of jsonPhyKeys) {
    const list = jsonBank.Physics[ch];
    if (!list) {
      throw new Error(`Missing chapter in JSON: ${ch}`);
    }
    totalJsonPhy += list.length;
    console.log(`  - [${ch}]: ${list.length} questions`);
    if (list.length !== 40) {
      throw new Error(`Expected 40 questions in JSON bank for chapter "${ch}", found ${list.length}`);
    }

    for (const q of list) {
      if (jsonAllIds.has(q.id)) {
        throw new Error(`Duplicate ID in JSON: ${q.id}`);
      }
      jsonAllIds.add(q.id);
    }
  }

  console.log(`Total Physics MCQs in JSON Bank: ${totalJsonPhy} (Expected 360)`);

  // 3. Verify Other Subjects are completely intact
  console.log('\n[3] Verifying other subjects in TS and JSON:');
  const subjectsMap: Record<string, string> = {
    Chemistry: 'Chemistry',
    Biology: 'Biology',
    Mathematics: 'Mathematics',
    Urdu: 'Urdu',
    Islamiyat: 'Islamiat',
  };
  for (const [tsSubj, jsonSubj] of Object.entries(subjectsMap)) {
    const tsChapters = Object.keys(FBISE_9_QUESTION_BANK[tsSubj] || {});
    const jsonChapters = Object.keys(jsonBank[jsonSubj] || {});
    console.log(`  - ${tsSubj}: TS chapters = ${tsChapters.length}, JSON (${jsonSubj}) chapters = ${jsonChapters.length}`);
    if (tsChapters.length === 0 || jsonChapters.length === 0) {
      throw new Error(`Subject ${tsSubj} is missing or empty!`);
    }
  }

  console.log('\n=== ALL 360 GRADE 9 PHYSICS QUESTIONS VERIFIED SUCCESSFULLY ===');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
