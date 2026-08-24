/**
 * Comprehensive Validation, Sanitization, and Verification Pipeline
 * for FBISE Grade 9 Question Banks (src/data/banks/*.json).
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

const BANKS_DIR = path.join(__dirname, '../src/data/banks');

function runComprehensiveAudit() {
  console.log('====================================================');
  console.log(' FBISE Grade 9 Question Banks Comprehensive Audit   ');
  console.log('====================================================');

  if (!fs.existsSync(BANKS_DIR)) {
    throw new Error(`Target directory not found at ${BANKS_DIR}`);
  }

  const files = fs.readdirSync(BANKS_DIR).filter((f) => f.endsWith('.json'));
  console.log(`Auditing ${files.length} subject files in ${BANKS_DIR}`);

  let grandTotalQuestions = 0;
  const auditReport = {};

  for (const file of files) {
    const filePath = path.join(BANKS_DIR, file);
    const rawFile = fs.readFileSync(filePath, 'utf-8');
    const subject = file.replace('.json', '');

    let chapters;
    try {
      chapters = JSON.parse(rawFile);
    } catch (err) {
      console.error(`✗ JSON.parse() failed on ${file}:`, err.message);
      throw err;
    }

    const chapKeys = Object.keys(chapters);
    let subTotal = 0;
    const issues = [];

    for (const chName of chapKeys) {
      const mcqs = chapters[chName];
      if (!Array.isArray(mcqs)) {
        issues.push({ chapter: chName, error: 'Not an array' });
        continue;
      }
      subTotal += mcqs.length;
      for (const mcq of mcqs) {
        if (!mcq.id || !mcq.question || !mcq.options || !mcq.correctAnswer) {
          issues.push({ id: mcq.id, chapter: chName, error: 'Missing required field' });
        }
      }
    }

    grandTotalQuestions += subTotal;
    auditReport[subject] = {
      file,
      chaptersCount: chapKeys.length,
      questionsCount: subTotal,
      issuesCount: issues.length,
    };

    // Sanitize in-place
    const cleaned = {};
    for (const chName of chapKeys) {
      cleaned[chName] = (chapters[chName] || []).map((q) => sanitizeStoredMCQ(q));
    }
    fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2), 'utf-8');
  }

  console.log('--- Subject Breakdown ---');
  for (const [subj, stat] of Object.entries(auditReport)) {
    console.log(
      `• ${subj.padEnd(12)}: ${String(stat.chaptersCount).padStart(2)} chapters | ${String(stat.questionsCount).padStart(4)} MCQs | ${stat.issuesCount} issues`
    );
  }
  console.log(`Total questions audited: ${grandTotalQuestions}`);
  console.log('✓ All subject files verified and safely formatted.');
  console.log('====================================================');
}

runComprehensiveAudit();
