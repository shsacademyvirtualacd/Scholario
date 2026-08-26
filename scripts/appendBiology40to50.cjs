/**
 * appendBiology40to50.cjs
 * 
 * Appends 10 new verified MCQs per chapter to Grade 9 FBISE Biology (40 -> 50 per chapter = 500 total)
 * Keeps all 40 existing questions intact and preserves all other subjects.
 */

const fs = require('fs');
const path = require('path');
const { safeWriteQuestionBank } = require('./utils/safeJsonWriter.cjs');

const part1 = require('./data/biologyAppend40to50Part1.cjs');
const part2 = require('./data/biologyAppend40to50Part2.cjs');

const BIO_BANK_PATH = path.resolve('src/data/banks/biology.json');
const FULL_BANK_PATH = path.resolve('src/data/grade9FbiseBank.json');

console.log('=== STEP 1: READ EXISTING BIOLOGY BANK ===');
const existingBioRaw = JSON.parse(fs.readFileSync(BIO_BANK_PATH, 'utf-8'));

const chapters = [
  "The Science of Biology",
  "Molecular Biology",
  "The Cell",
  "Tissues, Organs and Organ Systems",
  "Cell Cycle",
  "Biodiversity",
  "Metabolism",
  "Plant Physiology",
  "Plant Reproduction",
  "Evolution"
];

const existingBio40 = {};
for (const ch of chapters) {
  if (!existingBioRaw[ch] || existingBioRaw[ch].length < 40) {
    throw new Error(`Expected at least 40 existing questions in ${ch}, found ${existingBioRaw[ch] ? existingBioRaw[ch].length : 0}`);
  }
  // Take original 40
  existingBio40[ch] = existingBioRaw[ch].slice(0, 40);
  console.log(`  Existing ${ch.padEnd(40)}: 40 MCQs preserved`);
}

console.log('\n=== STEP 2: VERIFY AND BALANCE NEW BATCH (10 QUESTIONS PER CHAPTER) ===');
const appendBatch = {
  ...part1,
  ...part2
};

const allExistingIds = new Set();
for (const ch of chapters) {
  for (const q of existingBio40[ch]) {
    allExistingIds.add(q.id);
  }
}

// Balanced template for items 41-50: spread across A, B, C, D
// In 31-40 we used: ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B'] (which had 3 A, 3 B, 2 C, 2 D)
// For 41-50 let's use: ['C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D'] (which has 2 A, 2 B, 3 C, 3 D)
// Result across all 50 items per chapter: 15 Easy, 15 Medium, 10 Hard, 10 Board Exam | Exactly 13 A, 13 B, 12 C, 12 D (or ~12.5 each!)
const targetAnswersNew = ['C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D'];

for (const [chIdx, ch] of chapters.entries()) {
  const newQs = appendBatch[ch];
  if (!newQs || newQs.length !== 10) {
    throw new Error(`Expected 10 new questions for ${ch}, got ${newQs ? newQs.length : 0}`);
  }

  newQs.forEach((q, idx) => {
    const expectedId = `fbise9_bio_ch${chIdx + 1}_${idx + 41}`;
    if (q.id !== expectedId) {
      throw new Error(`ID mismatch: expected ${expectedId}, got ${q.id}`);
    }

    if (allExistingIds.has(q.id)) {
      throw new Error(`Duplicate question ID detected: ${q.id}`);
    }
    allExistingIds.add(q.id);

    if (!q.question || q.question.trim().length === 0) {
      throw new Error(`Empty question text in ${ch} [${q.id}]`);
    }

    if (!q.options || !q.options.A || !q.options.B || !q.options.C || !q.options.D) {
      throw new Error(`Incomplete options in ${ch} [${q.id}]`);
    }

    if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
      throw new Error(`Invalid correct answer in ${ch} [${q.id}]: ${q.correctAnswer}`);
    }

    if (!q.explanation || q.explanation.trim().length === 0) {
      throw new Error(`Empty explanation in ${ch} [${q.id}]`);
    }

    // Balance option placement according to targetAnswersNew
    const targetKey = targetAnswersNew[idx];
    const currentKey = q.correctAnswer;
    if (currentKey !== targetKey) {
      const tempContent = q.options[targetKey];
      q.options[targetKey] = q.options[currentKey];
      q.options[currentKey] = tempContent;
      q.correctAnswer = targetKey;
    }
  });
}

console.log('✓ All 100 new questions verified and answer keys balanced.');

console.log('\n=== STEP 3: APPEND TO EXISTING CHAPTER ARRAYS (40 -> 50) ===');
const updatedBio = {};

for (const ch of chapters) {
  // Preserve original 40 questions exactly as they were
  const original40 = existingBio40[ch];
  const new10 = appendBatch[ch];
  updatedBio[ch] = [...original40, ...new10];

  if (updatedBio[ch].length !== 50) {
    throw new Error(`Expected 50 questions in ${ch}, found ${updatedBio[ch].length}`);
  }
  console.log(`  ✓ Chapter ${ch.padEnd(40)}: 50 verified MCQs`);
}

// Write to src/data/banks/biology.json
fs.writeFileSync(BIO_BANK_PATH, JSON.stringify(updatedBio, null, 2), 'utf-8');
console.log('✓ Successfully wrote src/data/banks/biology.json with 500 MCQs (50/chapter)');

console.log('\n=== STEP 4: UPDATE UNIFIED BANK src/data/grade9FbiseBank.json ===');
const subjects = ['physics', 'chemistry', 'biology', 'mathematics', 'urdu', 'english'];
const fullBank = {};

for (const sub of subjects) {
  const filePath = path.resolve(`src/data/banks/${sub}.json`);
  if (fs.existsSync(filePath)) {
    const capitalized = sub.charAt(0).toUpperCase() + sub.slice(1);
    fullBank[capitalized] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const chapCount = Object.keys(fullBank[capitalized]).length;
    const qCount = Object.values(fullBank[capitalized]).reduce((acc, cur) => acc + cur.length, 0);
    console.log(`  Subject ${capitalized.padEnd(15)}: ${chapCount} chapters, ${qCount} questions`);
  }
}

safeWriteQuestionBank(FULL_BANK_PATH, fullBank);
console.log('✓ Unified grade9FbiseBank.json safely written and validated');

console.log('\n=== STEP 5: FINAL SYSTEM-WIDE VALIDATION ===');
const checkBank = JSON.parse(fs.readFileSync(FULL_BANK_PATH, 'utf-8'));

for (const ch of chapters) {
  const qs = checkBank.Biology[ch];
  if (!qs || qs.length !== 50) {
    throw new Error(`Biology chapter "${ch}" does not have 50 MCQs (found ${qs ? qs.length : 0})`);
  }
  
  // Verify difficulty distribution per chapter (15 easy, 15 medium, 10 hard, 10 board_exam)
  const diffs = { easy: 0, medium: 0, hard: 0, board_exam: 0 };
  const ans = { A: 0, B: 0, C: 0, D: 0 };
  
  qs.forEach(q => {
    diffs[q.difficulty] = (diffs[q.difficulty] || 0) + 1;
    ans[q.correctAnswer] = (ans[q.correctAnswer] || 0) + 1;
  });
  
  if (diffs.easy !== 15 || diffs.medium !== 15 || diffs.hard !== 10 || diffs.board_exam !== 10) {
    throw new Error(`Difficulty count mismatch in ${ch}: ${JSON.stringify(diffs)}`);
  }
  console.log(`  ✓ ${ch.padEnd(35)}: 50 MCQs | ${JSON.stringify(diffs)} | Ans: ${JSON.stringify(ans)}`);
}

// Check other subject totals
const physCount = Object.values(checkBank.Physics).reduce((a, b) => a + b.length, 0);
if (physCount !== 450) throw new Error(`Physics count changed: ${physCount}`);

const chemCount = Object.values(checkBank.Chemistry).reduce((a, b) => a + b.length, 0);
if (chemCount !== 570) throw new Error(`Chemistry count changed: ${chemCount}`);

const mathCount = Object.values(checkBank.Mathematics).reduce((a, b) => a + b.length, 0);
if (mathCount !== 550) throw new Error(`Mathematics count changed: ${mathCount}`);

const urduCount = Object.values(checkBank.Urdu).reduce((a, b) => a + b.length, 0);
if (urduCount !== 380) throw new Error(`Urdu count changed: ${urduCount}`);

const engCount = Object.values(checkBank.English).reduce((a, b) => a + b.length, 0);
if (engCount !== 850) throw new Error(`English count changed: ${engCount}`);

console.log('\n✓ All verification checks succeeded!');
console.log('  - Biology: 500 MCQs (10 chapters × 50 MCQs)');
console.log('  - Total Grade 9 Bank: 3,300 MCQs');
