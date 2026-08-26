const fs = require('fs');
const path = require('path');

// 1. Verify urdu.json
const urduJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/banks/urdu.json'), 'utf8'));
const chapters = Object.keys(urduJson);
console.log('=== URDU BANK VERIFICATION ===');
console.log('Total Urdu chapters in urdu.json:', chapters.length);
if (chapters.length !== 22) throw new Error(`Expected 22 Urdu chapters, got ${chapters.length}`);

let totalMCQs = 0;
chapters.forEach((ch, idx) => {
  const mcqs = urduJson[ch];
  if (!Array.isArray(mcqs) || mcqs.length !== 10) {
    throw new Error(`Chapter "${ch}" has ${mcqs ? mcqs.length : 0} MCQs instead of 10`);
  }
  const easy = mcqs.filter(q => q.difficulty === 'easy').length;
  const med = mcqs.filter(q => q.difficulty === 'medium').length;
  const hard = mcqs.filter(q => q.difficulty === 'hard').length;
  
  // Validate each question
  mcqs.forEach((q, qIdx) => {
    if (!q.id) throw new Error(`Missing id in ${ch} Q${qIdx}`);
    if (!q.question) throw new Error(`Missing question in ${ch} Q${qIdx}`);
    if (!q.options || !q.options.A || !q.options.B || !q.options.C || !q.options.D) {
      throw new Error(`Invalid options in ${ch} Q${qIdx}: ${JSON.stringify(q.options)}`);
    }
    if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
      throw new Error(`Invalid correctAnswer in ${ch} Q${qIdx}: ${q.correctAnswer}`);
    }
    if (!q.explanation) throw new Error(`Missing explanation in ${ch} Q${qIdx}`);
  });
  
  console.log(`${idx + 1}. [${ch}] - 10 MCQs (E:${easy}, M:${med}, H:${hard}) - OK`);
  totalMCQs += mcqs.length;
});
console.log(`Total Verified Urdu MCQs: ${totalMCQs}`);

// 2. Verify full bank
const fullBank = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/grade9FbiseBank.json'), 'utf8'));
console.log('\n=== FULL GRADE 9 BANK SUMMARY ===');
for (const [sub, subChs] of Object.entries(fullBank)) {
  let subCount = 0;
  const subChKeys = Object.keys(subChs);
  subChKeys.forEach(k => {
    subCount += subChs[k].length;
  });
  console.log(`- ${sub}: ${subChKeys.length} chapters, ${subCount} total MCQs`);
}
console.log('\nAll checks passed successfully!');
