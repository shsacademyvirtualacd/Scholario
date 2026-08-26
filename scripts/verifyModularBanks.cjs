const fs = require('fs');
const path = require('path');

console.log('=== COMPREHENSIVE MODULAR QUESTION BANK AUDITOR ===\n');

const banksDir = path.resolve('src/data/banks');

const allSubjects = [
  { name: 'Physics', dir: 'physics', expectedChapters: 9, expectedMCQs: 450 },
  { name: 'Biology', dir: 'biology', expectedChapters: 10, expectedMCQs: 500 },
  { name: 'Chemistry', dir: 'chemistry', expectedChapters: 19, expectedMCQs: 570 },
  { name: 'Mathematics', dir: 'mathematics', expectedChapters: 11, expectedMCQs: 550 },
  { name: 'English', dir: 'english', expectedChapters: 17, expectedMCQs: 850 },
  { name: 'Urdu', dir: 'urdu', expectedChapters: 22, expectedMCQs: 1100 },
];

let grandTotalMCQs = 0;
let totalFilesAudited = 0;
let errorsFound = 0;

allSubjects.forEach(subj => {
  const dirPath = path.join(banksDir, subj.dir);
  if (!fs.existsSync(dirPath)) {
    console.error(`✗ Missing subject directory: ${subj.dir}`);
    errorsFound++;
    return;
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json')).sort();
  let subjTotal = 0;
  let totalBytes = 0;
  
  files.forEach(f => {
    totalFilesAudited++;
    const filePath = path.join(dirPath, f);
    const buf = fs.readFileSync(filePath);
    totalBytes += buf.length;
    
    try {
      const questions = JSON.parse(buf.toString('utf8'));
      subjTotal += questions.length;

      // Validate question structure
      questions.forEach((q, idx) => {
        if (!q.id || !q.question || !q.options || !q.correctAnswer || !q.explanation) {
          console.error(`✗ Missing required fields in ${subj.dir}/${f} at index ${idx} (id: ${q.id})`);
          errorsFound++;
        }
      });
    } catch (err) {
      console.error(`✗ Parse error in ${subj.dir}/${f}: ${err.message}`);
      errorsFound++;
    }
  });

  grandTotalMCQs += subjTotal;
  const avgKb = (totalBytes / files.length / 1024).toFixed(1);
  const status = (subjTotal === subj.expectedMCQs && files.length === subj.expectedChapters) ? '✓' : '✗';
  console.log(`${status} ${subj.name.padEnd(14)}: ${(totalBytes / 1024).toFixed(1).padStart(6)} KB | ${String(files.length).padStart(2)} chapter files (avg ${avgKb} KB/file) | ${String(subjTotal).padStart(4)} MCQs (expected ${subj.expectedMCQs})`);
});

console.log('----------------------------------------------------');
console.log(`TOTAL CHAPTER FILES AUDITED: ${totalFilesAudited}`);
console.log(`GRAND TOTAL VERIFIED MCQs ACROSS ALL 6 SUBJECTS: ${grandTotalMCQs}`);
console.log(`TOTAL VALIDATION ERRORS: ${errorsFound}`);
console.log('----------------------------------------------------\n');

if (grandTotalMCQs !== 4020 || errorsFound > 0) {
  throw new Error(`Integrity check failed! Expected 4,020 total MCQs with 0 errors, got ${grandTotalMCQs} MCQs and ${errorsFound} errors.`);
}

console.log('✓ All 6 subjects verified: 100% modular, 0 binary corruption, zero data loss!');
