/**
 * appendBiologyBank.cjs
 * 
 * Appends 10 new verified MCQs per chapter to Grade 9 FBISE Biology (10 -> 20 per chapter = 200 total)
 * Keeps all 10 existing questions intact and preserves all other subjects.
 */

const fs = require('fs');
const path = require('path');
const { safeWriteQuestionBank } = require('./utils/safeJsonWriter.cjs');

const part1 = require('./data/biologyAppend10Part1.cjs');
const part2 = require('./data/biologyAppend10Part2.cjs');

const BIO_BANK_PATH = path.resolve('src/data/banks/biology.json');
const FULL_BANK_PATH = path.resolve('src/data/grade9FbiseBank.json');

console.log('=== STEP 1: READ EXISTING BIOLOGY BANK ===');
const existingBio = JSON.parse(fs.readFileSync(BIO_BANK_PATH, 'utf-8'));

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

for (const ch of chapters) {
  if (!existingBio[ch] || existingBio[ch].length !== 10) {
    throw new Error(`Expected exactly 10 existing questions in ${ch}, found ${existingBio[ch] ? existingBio[ch].length : 0}`);
  }
  console.log(`  Existing ${ch.padEnd(40)}: 10 MCQs`);
}

console.log('\n=== STEP 2: VERIFY AND BALANCE NEW BATCH (10 QUESTIONS PER CHAPTER) ===');
const appendBatch = {
  ...part1,
  ...part2
};

const allExistingIds = new Set();
for (const ch of chapters) {
  for (const q of existingBio[ch]) {
    allExistingIds.add(q.id);
  }
}

const targetAnswersNew = ['C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D']; // Balanced template for items 11-20

for (const [chIdx, ch] of chapters.entries()) {
  const newQs = appendBatch[ch];
  if (!newQs || newQs.length !== 10) {
    throw new Error(`Expected 10 new questions for ${ch}, got ${newQs ? newQs.length : 0}`);
  }

  newQs.forEach((q, idx) => {
    const expectedId = `fbise9_bio_ch${chIdx + 1}_${idx + 11}`;
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

console.log('\n=== STEP 3: APPEND TO EXISTING CHAPTER ARRAYS (10 -> 20) ===');
const updatedBio = {};

for (const ch of chapters) {
  // Preserve original 10 questions exactly as they were
  const original10 = existingBio[ch];
  const new10 = appendBatch[ch];
  updatedBio[ch] = [...original10, ...new10];

  if (updatedBio[ch].length !== 20) {
    throw new Error(`Expected 20 questions in ${ch}, found ${updatedBio[ch].length}`);
  }
  console.log(`  ✓ Chapter ${ch.padEnd(40)}: 20 verified MCQs`);
}

// Write to src/data/banks/biology.json
fs.writeFileSync(BIO_BANK_PATH, JSON.stringify(updatedBio, null, 2), 'utf-8');
console.log('✓ Successfully wrote src/data/banks/biology.json with 200 MCQs (20/chapter)');

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
  if (!qs || qs.length !== 20) {
    throw new Error(`Biology chapter "${ch}" does not have 20 MCQs (found ${qs ? qs.length : 0})`);
  }
  
  // Verify difficulty distribution per chapter (6 easy, 6 medium, 4 hard, 4 board_exam)
  const diffs = { easy: 0, medium: 0, hard: 0, board_exam: 0 };
  const ans = { A: 0, B: 0, C: 0, D: 0 };
  
  qs.forEach(q => {
    diffs[q.difficulty] = (diffs[q.difficulty] || 0) + 1;
    ans[q.correctAnswer] = (ans[q.correctAnswer] || 0) + 1;
  });
  
  if (diffs.easy !== 6 || diffs.medium !== 6 || diffs.hard !== 4 || diffs.board_exam !== 4) {
    throw new Error(`Difficulty count mismatch in ${ch}: ${JSON.stringify(diffs)}`);
  }
  if (ans.A !== 5 || ans.B !== 5 || ans.C !== 5 || ans.D !== 5) {
    throw new Error(`Answer distribution mismatch in ${ch}: ${JSON.stringify(ans)}`);
  }
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

console.log('✓ All verification checks succeeded!');
console.log('  - Biology: 200 MCQs (10 chapters × 20 MCQs)');
console.log('  - Total Grade 9 Bank: 3,000 MCQs');
