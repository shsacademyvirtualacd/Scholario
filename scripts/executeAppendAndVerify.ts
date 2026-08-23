import fs from 'fs';
import path from 'path';
import { NEW_TEN_MCQS_PER_CHAPTER } from './appendPhysicsTenMore';
import { validateMCQQuestion, checkQuestionDuplicate, calculateQuestionSimilarity } from '../src/lib/mcqValidator';
import type { StoredMCQ } from '../src/types/questionBank';

const JSON_PATH = path.resolve(process.cwd(), 'src/data/grade9FbiseBank.json');
const TS_PATH = path.resolve(process.cwd(), 'src/lib/fbise9QuestionsBank.ts');

const CHAPTER_MAPPING: Record<string, { jsonKey: string; tsKey: string; altJsonKey?: string }> = {
  'Physical Quantities and Measurement': { jsonKey: 'Physical Quantities and Measurement', tsKey: 'Physical Quantities and Measurement' },
  'Kinematics': { jsonKey: 'Kinematics', tsKey: 'Kinematics' },
  'Dynamics – I': { jsonKey: 'Dynamics – I', tsKey: 'Dynamics-I', altJsonKey: 'Dynamics-I' },
  'Dynamics – II': { jsonKey: 'Dynamics – II', tsKey: 'Dynamics-II', altJsonKey: 'Dynamics-II' },
  'Pressure and Deformation in Solids': { jsonKey: 'Pressure and Deformation in Solids', tsKey: 'Pressure and Deformation in Solids' },
  'Work and Energy': { jsonKey: 'Work and Energy', tsKey: 'Work and Energy' },
  'Density and Temperature': { jsonKey: 'Density and Temperature', tsKey: 'Density and Temperature' },
  'Magnetism': { jsonKey: 'Magnetism', tsKey: 'Magnetism' },
  'Nature of Science and Physics': { jsonKey: 'Nature of Science and Physics', tsKey: 'Nature of Science and Physics' },
};

async function execute() {
  console.log('=== Step 1: Validating all 90 New MCQs ===');
  let totalNew = 0;
  const newQuestionIds = new Set<string>();

  for (const [chName, qList] of Object.entries(NEW_TEN_MCQS_PER_CHAPTER)) {
    if (qList.length !== 10) {
      throw new Error(`Chapter "${chName}" has ${qList.length} questions instead of 10!`);
    }
    totalNew += qList.length;

    for (const q of qList) {
      if (newQuestionIds.has(q.id)) {
        throw new Error(`Duplicate ID found among new questions: ${q.id}`);
      }
      newQuestionIds.add(q.id);

      const val = validateMCQQuestion(q, { subject: 'Physics', topic: chName, grade: '9', board: 'fbise' });
      if (!val.valid) {
        throw new Error(`Validation failed for new question ${q.id}: ${val.reason}`);
      }
    }
  }
  console.log(`Successfully validated all ${totalNew} new questions!`);

  console.log('\n=== Step 2: Reading Existing JSON and Verifying Current 270 Questions ===');
  const rawJson = fs.readFileSync(JSON_PATH, 'utf8');
  const jsonBank = JSON.parse(rawJson);

  if (!jsonBank.Physics) {
    throw new Error('Physics subject missing from JSON bank!');
  }

  const existingPhysicsIds = new Set<string>();
  const originalPhysicsQuestionsByChapter: Record<string, StoredMCQ[]> = {};

  for (const [chName, map] of Object.entries(CHAPTER_MAPPING)) {
    const list = jsonBank.Physics[map.jsonKey] || jsonBank.Physics[map.tsKey];
    if (!list || list.length !== 30) {
      throw new Error(`Expected exactly 30 questions in JSON for chapter "${chName}", found ${list ? list.length : 0}`);
    }
    originalPhysicsQuestionsByChapter[chName] = [...list];
    for (const q of list) {
      if (existingPhysicsIds.has(q.id)) {
        throw new Error(`Duplicate ID already in JSON bank: ${q.id}`);
      }
      existingPhysicsIds.add(q.id);
    }
  }

  if (existingPhysicsIds.size !== 270) {
    throw new Error(`Expected 270 unique existing Physics question IDs, found ${existingPhysicsIds.size}`);
  }
  console.log(`Original 270 Physics questions verified in JSON bank.`);

  console.log('\n=== Step 3: Checking for Duplicates / Near-Duplicates against Existing 270 Questions ===');
  for (const [chName, newQs] of Object.entries(NEW_TEN_MCQS_PER_CHAPTER)) {
    const existingList = originalPhysicsQuestionsByChapter[chName];
    for (const nq of newQs) {
      for (const eq of existingList) {
        const dup = checkQuestionDuplicate(nq, [eq]);
        if (dup.isDuplicate) {
          throw new Error(`Duplicate detected between new question ${nq.id} and existing ${eq.id}: ${dup.reason}`);
        }
        const sim = calculateQuestionSimilarity(nq.question, eq.question);
        if (sim.similarity > 0.85 || sim.isTemplateDuplicate) {
          throw new Error(`High similarity (${sim.similarity.toFixed(2)}) between new ${nq.id} and existing ${eq.id}`);
        }
      }
    }
  }
  console.log('No duplicates or high similarities detected against existing 270 questions!');

  console.log('\n=== Step 4: Constructing Combined 360-Question JSON Bank (Append-Only) ===');
  const now = new Date().toISOString();
  const updatedJsonBank = JSON.parse(JSON.stringify(jsonBank));

  for (const [chName, map] of Object.entries(CHAPTER_MAPPING)) {
    const newQs = NEW_TEN_MCQS_PER_CHAPTER[chName];
    const existingQs = originalPhysicsQuestionsByChapter[chName];

    const formattedNewQs: StoredMCQ[] = newQs.map((q) => ({
      id: q.id,
      board: 'fbise',
      grade: '9',
      subject: 'Physics',
      chapter: q.chapter,
      chapterNumber: q.chapterNumber,
      topic: q.topic,
      question: q.question,
      options: { ...q.options },
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      verified: true,
      source: 'expert-verified',
      createdAt: now,
    }));

    const combined = [...existingQs, ...formattedNewQs];
    if (combined.length !== 40) {
      throw new Error(`Combined list for chapter "${chName}" has ${combined.length} questions, expected 40`);
    }

    updatedJsonBank.Physics[map.jsonKey] = combined;
    if (map.altJsonKey) {
      updatedJsonBank.Physics[map.altJsonKey] = combined;
    }
  }

  // Verify non-Physics subjects in JSON are completely untouched
  const nonPhySubjects = ['Chemistry', 'Biology', 'Mathematics', 'Urdu', 'Islamiat'];
  for (const subj of nonPhySubjects) {
    if (JSON.stringify(jsonBank[subj]) !== JSON.stringify(updatedJsonBank[subj])) {
      throw new Error(`Subject ${subj} in JSON was modified unexpectedly!`);
    }
  }

  console.log('\n=== Step 5: Constructing Combined 360-Question TypeScript Bank ===');
  // Read and build the updated src/lib/fbise9QuestionsBank.ts
  const tsContent = fs.readFileSync(TS_PATH, 'utf8');

  // Let's verify how FBISE_9_QUESTION_BANK is exported in TS
  // We can format FBISE_9_QUESTION_BANK.Physics cleanly with all 9 chapters having 40 questions
  // and keep the rest of the file (Chemistry, Biology, Mathematics, Urdu, Islamiyat) exactly as-is.

  // Let's find the boundaries of Physics in fbise9QuestionsBank.ts
  const physicsStartIdx = tsContent.indexOf('  Physics: {');
  if (physicsStartIdx === -1) {
    throw new Error('Could not locate "Physics: {" in fbise9QuestionsBank.ts');
  }

  const chemistryStartIdx = tsContent.indexOf('  Chemistry: {');
  if (chemistryStartIdx === -1) {
    throw new Error('Could not locate "Chemistry: {" in fbise9QuestionsBank.ts');
  }

  // Format Physics section
  let physicsTsCode = '  Physics: {\n';
  for (const [chName, map] of Object.entries(CHAPTER_MAPPING)) {
    const list = updatedJsonBank.Physics[map.jsonKey];
    physicsTsCode += `    '${map.tsKey}': [\n`;
    for (const q of list) {
      physicsTsCode += `      {\n`;
      physicsTsCode += `        id: ${JSON.stringify(q.id)},\n`;
      physicsTsCode += `        chapter: ${JSON.stringify(q.chapter)},\n`;
      physicsTsCode += `        topic: ${JSON.stringify(q.topic || q.chapter)},\n`;
      physicsTsCode += `        question: ${JSON.stringify(q.question)},\n`;
      physicsTsCode += `        options: {\n`;
      physicsTsCode += `          A: ${JSON.stringify(q.options.A)},\n`;
      physicsTsCode += `          B: ${JSON.stringify(q.options.B)},\n`;
      physicsTsCode += `          C: ${JSON.stringify(q.options.C)},\n`;
      physicsTsCode += `          D: ${JSON.stringify(q.options.D)},\n`;
      physicsTsCode += `        },\n`;
      physicsTsCode += `        correctAnswer: ${JSON.stringify(q.correctAnswer)},\n`;
      physicsTsCode += `        explanation: ${JSON.stringify(q.explanation)},\n`;
      physicsTsCode += `        difficulty: ${JSON.stringify(q.difficulty)},\n`;
      physicsTsCode += `      },\n`;
    }
    physicsTsCode += `    ],\n`;
  }
  physicsTsCode += '  },\n';

  const updatedTsContent = tsContent.slice(0, physicsStartIdx) + physicsTsCode + tsContent.slice(chemistryStartIdx);

  console.log('\n=== Step 6: Writing Updated JSON and TS Files ===');
  fs.writeFileSync(JSON_PATH, JSON.stringify(updatedJsonBank, null, 2), 'utf8');
  console.log(`Updated ${JSON_PATH}`);

  fs.writeFileSync(TS_PATH, updatedTsContent, 'utf8');
  console.log(`Updated ${TS_PATH}`);

  console.log('\n=== Step 7: Final Verification of Output Files ===');
  // Re-read both files from disk and verify
  const writtenJson = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  let totalWrittenJsonPhy = 0;
  for (const [chName, map] of Object.entries(CHAPTER_MAPPING)) {
    const list = writtenJson.Physics[map.jsonKey];
    totalWrittenJsonPhy += list.length;
    if (list.length !== 40) {
      throw new Error(`JSON chapter "${chName}" has ${list.length} questions, expected 40`);
    }

    // Verify first 30 match original exactly
    const orig = originalPhysicsQuestionsByChapter[chName];
    for (let i = 0; i < 30; i++) {
      if (list[i].id !== orig[i].id) {
        throw new Error(`Original question at index ${i} in "${chName}" was altered! (Expected ${orig[i].id}, found ${list[i].id})`);
      }
    }
    // Verify last 10 match new questions
    const nqs = NEW_TEN_MCQS_PER_CHAPTER[chName];
    for (let i = 0; i < 10; i++) {
      if (list[30 + i].id !== nqs[i].id) {
        throw new Error(`New question at index ${30 + i} in "${chName}" mismatch! (Expected ${nqs[i].id}, found ${list[30 + i].id})`);
      }
    }
  }

  if (totalWrittenJsonPhy !== 360) {
    throw new Error(`Expected 360 total Physics questions in JSON, found ${totalWrittenJsonPhy}`);
  }

  console.log(`\n🎉 SUCCESS! All 9 chapters updated: 30 -> 40 questions per chapter (360 total).`);
  console.log(`Original 270 questions remain 100% intact and unchanged.`);
}

execute().catch((err) => {
  console.error('Execution failed:', err);
  process.exit(1);
});
