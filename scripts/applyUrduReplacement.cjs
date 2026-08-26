const fs = require('fs');
const path = require('path');

const part1 = require('./data/urduQawaidPart1.cjs');
const part2 = require('./data/urduQawaidPart2.cjs');
const part3 = require('./data/urduSanatenPart1.cjs');
const part4 = require('./data/urduSanatenPart2.cjs');

const allUrduChapters = {
  ...part1,
  ...part2,
  ...part3,
  ...part4
};

const chapterKeys = Object.keys(allUrduChapters);
console.log(`Loaded ${chapterKeys.length} Urdu chapters:`);

let totalUrduMCQs = 0;
chapterKeys.forEach((chName, idx) => {
  const list = allUrduChapters[chName];
  console.log(`${idx + 1}. ${chName}: ${list.length} MCQs`);
  if (list.length !== 10) {
    throw new Error(`Chapter ${chName} has ${list.length} MCQs instead of 10!`);
  }
  const easy = list.filter(q => q.difficulty === 'easy').length;
  const med = list.filter(q => q.difficulty === 'medium').length;
  const hard = list.filter(q => q.difficulty === 'hard').length;
  if (easy !== 3 || med !== 4 || hard !== 3) {
    console.warn(`   WARNING: Chapter ${chName} distribution is ${easy}/${med}/${hard} instead of 3/4/3`);
  }
  totalUrduMCQs += list.length;
});
console.log(`Total Urdu MCQs: ${totalUrduMCQs}`);

// 1. Write to src/data/banks/urdu.json
const urduJsonPath = path.join(__dirname, '../src/data/banks/urdu.json');
fs.writeFileSync(urduJsonPath, JSON.stringify(allUrduChapters, null, 2), 'utf8');
console.log(`Successfully wrote ${urduJsonPath}`);

// 2. Read and update src/data/grade9FbiseBank.json
const fullBankPath = path.join(__dirname, '../src/data/grade9FbiseBank.json');
const fullBank = JSON.parse(fs.readFileSync(fullBankPath, 'utf8'));

console.log('Original subjects in grade9FbiseBank.json:', Object.keys(fullBank));

// Replace Urdu in fullBank
fullBank['Urdu'] = allUrduChapters;

fs.writeFileSync(fullBankPath, JSON.stringify(fullBank, null, 2), 'utf8');
console.log(`Successfully updated ${fullBankPath}`);

// 3. Verification
const verifiedFullBank = JSON.parse(fs.readFileSync(fullBankPath, 'utf8'));
console.log('\n--- VERIFICATION OF FULL BANK ---');
for (const [sub, chapters] of Object.entries(verifiedFullBank)) {
  let subTotal = 0;
  const chNames = Object.keys(chapters);
  for (const ch of chNames) {
    subTotal += chapters[ch].length;
  }
  console.log(`${sub}: ${chNames.length} chapters, ${subTotal} total MCQs`);
}
