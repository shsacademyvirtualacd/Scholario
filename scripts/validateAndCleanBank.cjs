/**
 * Comprehensive Validation, Sanitization, and Verification Pipeline
 * for FBISE Grade 9 Question Bank (grade9FbiseBank.json).
 *
 * Validates, cleans, and safely serializes all subjects with special focus on
 * Urdu / Arabic scripts (Islamiat, Urdu) and LaTeX formatting (Math, Physics, Chemistry).
 */

const fs = require('fs');
const path = require('path');
const {
  sanitizeMCQString,
  sanitizeStoredMCQ,
  sanitizeQuestionBank,
  safeWriteQuestionBank,
} = require('./utils/safeJsonWriter.cjs');

const JSON_PATH = path.join(__dirname, '../src/data/grade9FbiseBank.json');

function runComprehensiveAudit() {
  console.log('====================================================');
  console.log(' FBISE Grade 9 Question Bank Comprehensive Audit   ');
  console.log('====================================================');

  if (!fs.existsSync(JSON_PATH)) {
    throw new Error(`Target file not found at ${JSON_PATH}`);
  }

  const rawFile = fs.readFileSync(JSON_PATH, 'utf-8');
  console.log(`Read file: ${JSON_PATH} (${rawFile.length} bytes)`);

  let parsed;
  try {
    parsed = JSON.parse(rawFile);
    console.log('✓ Initial JSON.parse() succeeded.');
  } catch (err) {
    console.error('✗ Initial JSON.parse() failed:', err.message);
    throw err;
  }

  const subjects = Object.keys(parsed);
  console.log(`Detected subjects: ${subjects.join(', ')}`);

  let totalQuestionsCount = 0;
  const auditReport = {};

  for (const subject of subjects) {
    const chapters = parsed[subject];
    auditReport[subject] = { chaptersCount: Object.keys(chapters).length, questionsCount: 0, issues: [] };

    for (const [chapterName, questions] of Object.entries(chapters)) {
      if (!Array.isArray(questions)) {
        auditReport[subject].issues.push(`Chapter ${chapterName} is not an array`);
        continue;
      }

      auditReport[subject].questionsCount += questions.length;
      totalQuestionsCount += questions.length;

      questions.forEach((q, idx) => {
        const qContext = `${subject} -> "${chapterName}" -> Q#${idx + 1} (${q.id || 'NO_ID'})`;

        if (!q.id) auditReport[subject].issues.push(`${qContext}: Missing ID`);
        if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') {
          auditReport[subject].issues.push(`${qContext}: Missing or empty question`);
        }
        if (!q.options || typeof q.options !== 'object') {
          auditReport[subject].issues.push(`${qContext}: Missing or malformed options object`);
        } else {
          for (const optKey of ['A', 'B', 'C', 'D']) {
            if (!q.options[optKey] || typeof q.options[optKey] !== 'string') {
              auditReport[subject].issues.push(`${qContext}: Missing or empty option ${optKey}`);
            }
          }
        }
        if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
          auditReport[subject].issues.push(`${qContext}: Invalid correctAnswer "${q.correctAnswer}"`);
        }
        if (!q.explanation || typeof q.explanation !== 'string') {
          auditReport[subject].issues.push(`${qContext}: Missing or empty explanation`);
        }
      });
    }
  }

  console.log('\n--- Subject Breakdown ---');
  for (const [subj, stat] of Object.entries(auditReport)) {
    console.log(
      `• ${subj.padEnd(12)}: ${String(stat.chaptersCount).padStart(2)} chapters | ${String(stat.questionsCount).padStart(4)} MCQs | ${stat.issues.length} issues`
    );
    if (stat.issues.length > 0) {
      console.warn(`  Issues in ${subj}:`, stat.issues.slice(0, 5));
    }
  }
  console.log(`\nTotal questions audited: ${totalQuestionsCount}`);

  // Perform deep sanitization & safe serialization
  console.log('\nApplying full RFC 8259 compliant sanitization and safe serialization...');
  const cleanedBank = sanitizeQuestionBank(parsed);

  // Write safely with pre- and post-validation
  safeWriteQuestionBank(JSON_PATH, cleanedBank);

  // Verify file on disk with a fresh read
  const diskRaw = fs.readFileSync(JSON_PATH, 'utf-8');
  const diskParsed = JSON.parse(diskRaw);
  console.log('✓ Disk file read back and verified with JSON.parse() cleanly.');

  // Validate exact question counts match before and after
  let postCount = 0;
  for (const s of Object.keys(diskParsed)) {
    for (const c of Object.values(diskParsed[s])) {
      postCount += c.length;
    }
  }

  if (postCount !== totalQuestionsCount) {
    throw new Error(`Count mismatch! Pre: ${totalQuestionsCount}, Post: ${postCount}`);
  }

  console.log(`✓ 100% question count integrity confirmed (${postCount} MCQs preserved intact).`);
  console.log('====================================================');
  console.log(' AUDIT & SANITIZATION FINISHED SUCCESSFULLY        ');
  console.log('====================================================\n');
}

runComprehensiveAudit();
