const fs = require('fs');
const path = require('path');

// Load new batch parts (Questions 41-50)
const batch1 = require('./data/urduAppend10Batch5Part1.cjs');
const batch2 = require('./data/urduAppend10Batch5Part2.cjs');
const batch3 = require('./data/urduAppend10Batch5Part3.cjs');
const batch4 = require('./data/urduAppend10Batch5Part4.cjs');

const allNewChapters = {
  ...batch1,
  ...batch2,
  ...batch3,
  ...batch4
};

const newChapterKeys = Object.keys(allNewChapters);
console.log(`Loaded ${newChapterKeys.length} chapters in new batch (Questions 41-50).`);

if (newChapterKeys.length !== 22) {
  throw new Error(`Expected 22 chapters in new batch, got ${newChapterKeys.length}`);
}

// 1. Read existing urdu.json
const urduJsonPath = path.join(__dirname, '../src/data/banks/urdu.json');
const existingUrduJson = JSON.parse(fs.readFileSync(urduJsonPath, 'utf8'));

const existingKeys = Object.keys(existingUrduJson);
console.log(`Loaded ${existingKeys.length} chapters from existing urdu.json.`);

if (existingKeys.length !== 22) {
  throw new Error(`Expected 22 existing chapters, found ${existingKeys.length}`);
}

const combinedUrduBank = {};
let totalCombinedMCQs = 0;

for (const chName of existingKeys) {
  const existingList = existingUrduJson[chName];
  if (!existingList || existingList.length !== 40) {
    throw new Error(`Chapter "${chName}" in existing bank does not have 40 MCQs (has ${existingList ? existingList.length : 0})`);
  }

  const newList = allNewChapters[chName];
  if (!newList || newList.length !== 10) {
    throw new Error(`Chapter "${chName}" in new batch does not have 10 MCQs (has ${newList ? newList.length : 0})`);
  }

  // Check new list difficulty (3 easy, 4 medium, 3 hard)
  const newEasy = newList.filter(q => q.difficulty === 'easy').length;
  const newMed = newList.filter(q => q.difficulty === 'medium').length;
  const newHard = newList.filter(q => q.difficulty === 'hard').length;
  if (newEasy !== 3 || newMed !== 4 || newHard !== 3) {
    throw new Error(`Chapter "${chName}" new batch distribution error: E:${newEasy}, M:${newMed}, H:${newHard}. Expected E:3, M:4, H:3`);
  }

  // Check for duplicates between existing and new
  const existingQuestionsSet = new Set(existingList.map(q => q.question.trim()));
  const existingIdsSet = new Set(existingList.map(q => q.id.trim()));

  newList.forEach((q, idx) => {
    if (existingQuestionsSet.has(q.question.trim())) {
      throw new Error(`Duplicate question found in "${chName}" (new Q${idx + 41}): "${q.question}"`);
    }
    if (existingIdsSet.has(q.id.trim())) {
      throw new Error(`Duplicate ID found in "${chName}": "${q.id}"`);
    }
    if (!q.id || !q.question || !q.options || !q.options.A || !q.options.B || !q.options.C || !q.options.D || !['A', 'B', 'C', 'D'].includes(q.correctAnswer) || !q.explanation) {
      throw new Error(`Invalid question structure in "${chName}" Q${idx + 41}: ${JSON.stringify(q)}`);
    }
  });

  // Combine (strict append)
  const combinedList = [...existingList, ...newList];
  if (combinedList.length !== 50) {
    throw new Error(`Combined list for "${chName}" does not have 50 MCQs (has ${combinedList.length})`);
  }

  combinedUrduBank[chName] = combinedList;
  totalCombinedMCQs += combinedList.length;

  const totalE = combinedList.filter(q => q.difficulty === 'easy').length;
  const totalM = combinedList.filter(q => q.difficulty === 'medium').length;
  const totalH = combinedList.filter(q => q.difficulty === 'hard').length;

  console.log(`- [${chName}]: ${existingList.length} -> ${combinedList.length} MCQs (Total E:${totalE}, M:${totalM}, H:${totalH})`);
}

console.log(`\nTotal Combined Urdu MCQs across 22 chapters: ${totalCombinedMCQs}`);
if (totalCombinedMCQs !== 1100) {
  throw new Error(`Expected 1100 total Urdu MCQs, got ${totalCombinedMCQs}`);
}

// 2. Write to src/data/banks/urdu.json
fs.writeFileSync(urduJsonPath, JSON.stringify(combinedUrduBank, null, 2), 'utf8');
console.log(`\nSuccessfully written to ${urduJsonPath}`);

// 3. Read and update src/data/grade9FbiseBank.json (preserving all other subjects completely intact)
const fullBankPath = path.join(__dirname, '../src/data/grade9FbiseBank.json');
const fullBank = JSON.parse(fs.readFileSync(fullBankPath, 'utf8'));

console.log('\nSubject counts before update:');
for (const [sub, chapters] of Object.entries(fullBank)) {
  let count = 0;
  for (const ch of Object.keys(chapters)) {
    count += chapters[ch].length;
  }
  console.log(`- ${sub}: ${Object.keys(chapters).length} chapters, ${count} MCQs`);
}

// Replace ONLY Urdu with the new combinedUrduBank
fullBank['Urdu'] = combinedUrduBank;

// Write back with utf8
fs.writeFileSync(fullBankPath, JSON.stringify(fullBank, null, 2), 'utf8');
console.log(`\nSuccessfully updated ${fullBankPath}`);

// 4. Validate full bank file end-to-end
console.log('\n--- VERIFICATION OF FULL BANK ---');
const verifiedFullBank = JSON.parse(fs.readFileSync(fullBankPath, 'utf8'));

let grandTotal = 0;
for (const [sub, chapters] of Object.entries(verifiedFullBank)) {
  let subCount = 0;
  const chKeys = Object.keys(chapters);
  for (const ch of chKeys) {
    const list = chapters[ch];
    subCount += list.length;
    // verify each MCQ
    list.forEach((q, qIndex) => {
      if (!q.id || !q.question || !q.options || !q.options.A || !q.options.B || !q.options.C || !q.options.D || !['A', 'B', 'C', 'D'].includes(q.correctAnswer) || !q.explanation) {
        throw new Error(`Corrupted MCQ in ${sub} -> ${ch} at index ${qIndex}`);
      }
    });
  }
  grandTotal += subCount;
  console.log(`✓ ${sub}: ${chKeys.length} chapters, ${subCount} MCQs`);
}
console.log(`\nGrand Total across all subjects: ${grandTotal} MCQs`);
console.log('JSON parse and schema validation completed successfully without errors!');
