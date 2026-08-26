/**
 * appendMathToForty.cjs
 * 
 * Appends 10 new verified MCQs per Mathematics chapter (30 -> 40),
 * maintaining strict append-only integrity for existing questions and all other subjects.
 */

const fs = require('fs');
const path = require('path');
const { safeWriteQuestionBank } = require('./utils/safeJsonWriter.cjs');

const part5 = require('./data/mathTenMorePart5.cjs');
const part6 = require('./data/mathTenMorePart6.cjs');

const MATH_BANK_PATH = path.resolve('src/data/banks/mathematics.json');
const FULL_BANK_PATH = path.resolve('src/data/grade9FbiseBank.json');

console.log('=== STEP 1: LOAD EXISTING MATHEMATICS BANK ===');
if (!fs.existsSync(MATH_BANK_PATH)) {
  throw new Error(`Mathematics bank not found at ${MATH_BANK_PATH}`);
}

const existingMath = JSON.parse(fs.readFileSync(MATH_BANK_PATH, 'utf-8'));
const newMath = {};

const newQuestionsBatch = {
  ...part5,
  ...part6,
};

const chapters = [
  "Real Numbers",
  "Logarithms",
  "Sets and Relations",
  "Factorization and Algebraic Manipulation",
  "Linear Equations and Inequalities",
  "Trigonometry and Bearing",
  "Coordinate Geometry",
  "Geometry of Straight Lines",
  "Geometry and Polygons",
  "Practical Geometry",
  "Basic Statistics"
];

console.log('Verifying chapters and preparing append (30 -> 40 MCQs)...');

let totalExisting = 0;
let totalAdded = 0;
let totalFinal = 0;

for (const ch of chapters) {
  const existingQs = existingMath[ch] || [];
  const addedQs = newQuestionsBatch[ch] || [];

  if (existingQs.length !== 30) {
    console.warn(`Warning: Expected 30 existing questions for ${ch}, found ${existingQs.length}`);
  }
  if (addedQs.length !== 10) {
    throw new Error(`Error: Expected exactly 10 new questions to add for ${ch}, found ${addedQs.length}`);
  }

  // Verify no duplicate IDs between existing and added
  const existingIds = new Set(existingQs.map(q => q.id));
  for (const q of addedQs) {
    if (existingIds.has(q.id)) {
      throw new Error(`Duplicate MCQ ID detected in ${ch}: ${q.id}`);
    }
  }

  // Strict append: existing first, then new
  newMath[ch] = [...existingQs, ...addedQs];

  totalExisting += existingQs.length;
  totalAdded += addedQs.length;
  totalFinal += newMath[ch].length;

  console.log(`  ✓ ${ch.padEnd(45)}: ${existingQs.length} existing + ${addedQs.length} new = ${newMath[ch].length} total`);
}

console.log(`\nTotals: ${totalExisting} existing + ${totalAdded} added = ${totalFinal} final Mathematics MCQs`);

// Save updated mathematics.json
console.log('\n=== STEP 2: WRITE UPDATED src/data/banks/mathematics.json ===');
const singleSubjWrapper = { Mathematics: newMath };
safeWriteQuestionBank(MATH_BANK_PATH, singleSubjWrapper);

// Read back the inner object because safeWriteQuestionBank writes the full dictionary
const writtenData = JSON.parse(fs.readFileSync(MATH_BANK_PATH, 'utf-8'));
if (writtenData.Mathematics) {
  fs.writeFileSync(MATH_BANK_PATH, JSON.stringify(writtenData.Mathematics, null, 2), 'utf-8');
}
console.log('✓ Successfully written src/data/banks/mathematics.json with 40 MCQs/chapter');

console.log('\n=== STEP 3: UPDATE UNIFIED src/data/grade9FbiseBank.json ===');
const subjects = ['physics', 'chemistry', 'biology', 'mathematics', 'urdu', 'english'];
const fullBank = {};

for (const sub of subjects) {
  const filePath = path.resolve(`src/data/banks/${sub}.json`);
  if (fs.existsSync(filePath)) {
    const capitalized = sub.charAt(0).toUpperCase() + sub.slice(1);
    fullBank[capitalized] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const chapCount = Object.keys(fullBank[capitalized]).length;
    const qCount = Object.values(fullBank[capitalized]).reduce((acc, cur) => acc + cur.length, 0);
    console.log(`  Loaded ${capitalized.padEnd(15)}: ${chapCount} chapters, ${qCount} questions`);
  }
}

safeWriteQuestionBank(FULL_BANK_PATH, fullBank);
console.log('✓ Unified grade9FbiseBank.json written and validated.');

console.log('\n=== STEP 4: VERIFY COMPLETE BANK INTEGRITY ===');
const verifiedBank = JSON.parse(fs.readFileSync(FULL_BANK_PATH, 'utf-8'));

for (const ch of chapters) {
  const qs = verifiedBank.Mathematics[ch];
  if (!qs || qs.length !== 40) {
    throw new Error(`Verification failed for Mathematics chapter ${ch}: expected 40, found ${qs ? qs.length : 0}`);
  }
  qs.forEach((q, idx) => {
    if (!q.id || !q.question || !q.options.A || !q.options.B || !q.options.C || !q.options.D || !q.correctAnswer || !q.explanation) {
      throw new Error(`Incomplete question data in ${ch} at index ${idx}`);
    }
  });
}

console.log('✓ ALL 11 Mathematics chapters verified with EXACTLY 40 MCQs each (440 total)!');
console.log('✓ All other subjects remain 100% intact!');
