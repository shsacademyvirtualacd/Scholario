/**
 * safeJsonWriter.cjs
 * 
 * Reusable Node utility for reading, sanitizing, validating, and writing
 * question bank files safely without string interpolation bugs or escaping flaws.
 */

const fs = require('fs');
const path = require('path');

function sanitizeMCQString(input) {
  if (typeof input !== 'string') {
    return input === null || input === undefined ? '' : String(input);
  }

  let s = input;

  // 1. Repair backspace (\x08) from single-backslash \bullet or \beta
  if (s.includes('\x08')) {
    s = s.replace(/\x08bullet/g, '\\bullet')
         .replace(/\x08eta/g, '\\beta')
         .replace(/\x08/g, '');
  }

  // 2. Repair form-feed (\x0C) from single-backslash \frac or \phi
  if (s.includes('\x0C')) {
    s = s.replace(/\x0Crac/g, '\\frac')
         .replace(/\x0Chi/g, '\\phi')
         .replace(/\x0C/g, '');
  }

  // 3. Repair vertical tab (\x0B) from single-backslash \vec or \var
  if (s.includes('\x0B')) {
    s = s.replace(/\x0Bec/g, '\\vec')
         .replace(/\x0Bar/g, '\\var')
         .replace(/\x0B/g, '');
  }

  // 4. Repair unintended literal tab (\t / \x09) before common LaTeX keywords
  s = s.replace(/\t(ext|heta|au|imes|o|riangle|au)/g, '\\$1');

  // 5. Repair unintended literal CR/LF (\r, \n) before common LaTeX keywords
  s = s.replace(/[\r\n](ight|ho|ightarrow|u\{)/g, '\\$1');

  // 6. Clean any remaining non-printable control characters (< 0x20) except standard whitespace (\n, \r, \t)
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return s;
}

function sanitizeStoredMCQ(q) {
  return {
    id: sanitizeMCQString(q.id).trim(),
    board: sanitizeMCQString(q.board || 'fbise').trim(),
    grade: sanitizeMCQString(q.grade || '9').trim(),
    subject: sanitizeMCQString(q.subject).trim(),
    chapter: sanitizeMCQString(q.chapter).trim(),
    chapterNumber: typeof q.chapterNumber === 'number' ? q.chapterNumber : Number(q.chapterNumber) || 1,
    topic: sanitizeMCQString(q.topic || q.chapter).trim(),
    question: sanitizeMCQString(q.question).trim(),
    options: {
      A: sanitizeMCQString(q.options?.A ?? '').trim(),
      B: sanitizeMCQString(q.options?.B ?? '').trim(),
      C: sanitizeMCQString(q.options?.C ?? '').trim(),
      D: sanitizeMCQString(q.options?.D ?? '').trim(),
    },
    correctAnswer: (['A', 'B', 'C', 'D'].includes(q.correctAnswer) ? q.correctAnswer : 'A'),
    explanation: sanitizeMCQString(q.explanation ?? '').trim(),
    difficulty: (['easy', 'medium', 'hard', 'board_exam'].includes(q.difficulty) ? q.difficulty : 'medium'),
    verified: Boolean(q.verified ?? true),
    source: sanitizeMCQString(q.source || 'curriculum-bank').trim(),
    createdAt: q.createdAt || new Date().toISOString(),
  };
}

function sanitizeQuestionBank(bank) {
  const sanitized = {};

  for (const [subjectKey, chapters] of Object.entries(bank)) {
    const cleanSubjKey = sanitizeMCQString(subjectKey).trim();
    sanitized[cleanSubjKey] = {};

    for (const [chapKey, questions] of Object.entries(chapters)) {
      const cleanChapKey = sanitizeMCQString(chapKey).trim();
      if (!Array.isArray(questions)) continue;

      sanitized[cleanSubjKey][cleanChapKey] = questions.map((q) => sanitizeStoredMCQ(q));
    }
  }

  return sanitized;
}

function safeWriteQuestionBank(filePath, bankData) {
  const cleanBank = sanitizeQuestionBank(bankData);
  const jsonContent = JSON.stringify(cleanBank, null, 2);

  // Validate parsing before writing to disk
  try {
    JSON.parse(jsonContent);
  } catch (err) {
    throw new Error(`Sanitized bank failed JSON.parse validation: ${err.message}`);
  }

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, jsonContent, 'utf-8');
  console.log(`✓ Safely wrote validated question bank to: ${filePath}`);
}

module.exports = {
  sanitizeMCQString,
  sanitizeStoredMCQ,
  sanitizeQuestionBank,
  safeWriteQuestionBank,
};
