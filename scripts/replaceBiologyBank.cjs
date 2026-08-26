/**
 * replaceBiologyBank.cjs
 * 
 * Replaces all Biology MCQs in:
 *  1. src/data/banks/biology.json (10 chapters, exactly 10 MCQs each = 100 total)
 *  2. src/data/grade9FbiseBank.json (merged file updated with new Biology bank, keeping all other subjects 100% intact)
 */

const fs = require('fs');
const path = require('path');
const { safeWriteQuestionBank } = require('./utils/safeJsonWriter.cjs');

const part1 = require('./data/biology100ReplacementPart1.cjs');
const part2 = require('./data/biology100ReplacementPart2.cjs');

const BIO_BANK_PATH = path.resolve('src/data/banks/biology.json');
const FULL_BANK_PATH = path.resolve('src/data/grade9FbiseBank.json');

console.log('=== STEP 1: ASSEMBLE 100 NEW BIOLOGY QUESTIONS ===');
const newBio = {
  ...part1,
  ...part2,
};

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

let totalNew = 0;
const allIds = new Set();
const diffCounts = {};
const ansCounts = {};

for (const ch of chapters) {
  const qs = newBio[ch];
  if (!qs || qs.length !== 10) {
    throw new Error(`Invalid question count for ${ch}: expected 10, got ${qs ? qs.length : 0}`);
  }

  qs.forEach((q, idx) => {
    if (!q.id || allIds.has(q.id)) {
      throw new Error(`Duplicate or missing id in ${ch} at index ${idx}: ${q.id}`);
    }
    allIds.add(q.id);

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

    diffCounts[q.difficulty] = (diffCounts[q.difficulty] || 0) + 1;
    ansCounts[q.correctAnswer] = (ansCounts[q.correctAnswer] || 0) + 1;
  });

  totalNew += qs.length;
  console.log(`  ✓ Chapter ${ch.padEnd(40)}: 10 verified MCQs`);
}

console.log(`\nTotal verified Biology MCQs generated: ${totalNew}`);
console.log('Difficulty Distribution:', JSON.stringify(diffCounts));
console.log('Answer Key Distribution:', JSON.stringify(ansCounts));

// Randomize / balance answer keys so options are well-distributed across A, B, C, D
console.log('\n=== STEP 2: SHUFFLE & BALANCE ANSWER KEYS ACROSS OPTIONS ===');
// For each question, rotate or map options so that the correct answer is evenly distributed A, B, C, D
// Let's ensure balanced distribution per chapter: exactly 2 or 3 of each letter per chapter
for (const ch of chapters) {
  const qs = newBio[ch];
  const targetAnswers = ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B']; // Balanced template for 10 items
  
  qs.forEach((q, idx) => {
    const targetKey = targetAnswers[idx];
    const currentKey = q.correctAnswer;
    if (currentKey !== targetKey) {
      // Swap content between currentKey and targetKey
      const tempContent = q.options[targetKey];
      q.options[targetKey] = q.options[currentKey];
      q.options[currentKey] = tempContent;
      q.correctAnswer = targetKey;
    }
  });
}

// Re-verify answer distribution
const finalAnsCounts = {};
for (const ch of chapters) {
  for (const q of newBio[ch]) {
    finalAnsCounts[q.correctAnswer] = (finalAnsCounts[q.correctAnswer] || 0) + 1;
  }
}
console.log('Balanced Answer Distribution:', JSON.stringify(finalAnsCounts));

// Write to src/data/banks/biology.json
console.log('\n=== STEP 3: WRITE src/data/banks/biology.json (COMPLETE REPLACE) ===');
fs.writeFileSync(BIO_BANK_PATH, JSON.stringify(newBio, null, 2), 'utf-8');
console.log('✓ Successfully wrote src/data/banks/biology.json with 100 new MCQs (10/chapter)');

// Update unified src/data/grade9FbiseBank.json
console.log('\n=== STEP 4: UPDATE src/data/grade9FbiseBank.json (REPLACING ONLY BIOLOGY) ===');
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
console.log('✓ Unified grade9FbiseBank.json written and safely validated');

console.log('\n=== STEP 5: VERIFY FULL INTEGRITY ACROSS ALL SUBJECTS ===');
const checkBank = JSON.parse(fs.readFileSync(FULL_BANK_PATH, 'utf-8'));

if (Object.keys(checkBank.Biology).length !== 10) {
  throw new Error(`Biology should have 10 chapters, found ${Object.keys(checkBank.Biology).length}`);
}
for (const ch of chapters) {
  const qs = checkBank.Biology[ch];
  if (!qs || qs.length !== 10) {
    throw new Error(`Biology chapter "${ch}" does not have 10 MCQs (found ${qs ? qs.length : 0})`);
  }
}

// Verify Physics is still 450
const physCount = Object.values(checkBank.Physics).reduce((a, b) => a + b.length, 0);
if (physCount !== 450) throw new Error(`Physics count altered! Expected 450, got ${physCount}`);

// Verify Chemistry is still 570
const chemCount = Object.values(checkBank.Chemistry).reduce((a, b) => a + b.length, 0);
if (chemCount !== 570) throw new Error(`Chemistry count altered! Expected 570, got ${chemCount}`);

// Verify Mathematics is still 550
const mathCount = Object.values(checkBank.Mathematics).reduce((a, b) => a + b.length, 0);
if (mathCount !== 550) throw new Error(`Mathematics count altered! Expected 550, got ${mathCount}`);

// Verify Urdu is still 380
const urduCount = Object.values(checkBank.Urdu).reduce((a, b) => a + b.length, 0);
if (urduCount !== 380) throw new Error(`Urdu count altered! Expected 380, got ${urduCount}`);

// Verify English is still 850
const engCount = Object.values(checkBank.English).reduce((a, b) => a + b.length, 0);
if (engCount !== 850) throw new Error(`English count altered! Expected 850, got ${engCount}`);

console.log('✓ ALL subject checks passed!');
console.log('  - Physics: 450 MCQs (9 chapters)');
console.log('  - Chemistry: 570 MCQs (19 chapters)');
console.log('  - Biology: 100 MCQs (10 chapters - exactly 10/chapter)');
console.log('  - Mathematics: 550 MCQs (11 chapters)');
console.log('  - Urdu: 380 MCQs (19 chapters)');
console.log('  - English: 850 MCQs (17 chapters)');
console.log('  - Total Grade 9 Bank: 2,900 MCQs');
