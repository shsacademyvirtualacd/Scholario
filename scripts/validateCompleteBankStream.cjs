const fs = require('fs');
const path = require('path');

const BANKS_DIR = path.join(__dirname, '../src/data/banks');

console.log('=== Character-by-Character & Deep Structural Stream Validator ===');
console.log('Validating individual subject files in:', BANKS_DIR);

if (!fs.existsSync(BANKS_DIR)) {
  console.error('Banks directory not found!');
  process.exit(1);
}

const jsonFiles = fs.readdirSync(BANKS_DIR).filter((f) => f.endsWith('.json'));
console.log(`Found ${jsonFiles.length} subject files: ${jsonFiles.join(', ')}`);

const idMap = new Map();
const allIssues = [];
let totalMCQs = 0;
let totalSyntaxErrors = 0;

for (const file of jsonFiles) {
  const filePath = path.join(BANKS_DIR, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  console.log(`\nAuditing ${file} (${raw.length} bytes, ${raw.split('\n').length} lines)...`);

  // --- Step 1: Character-by-character parser state machine ---
  let inString = false;
  let isEscaped = false;
  let currentLine = 1;
  let currentCol = 1;
  let stringStartPos = { line: 0, col: 0 };
  const bracketStack = [];
  const syntaxErrors = [];

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];

    if (char === '\n') {
      if (inString && !isEscaped) {
        syntaxErrors.push({
          file,
          line: currentLine,
          col: currentCol,
          message: `Unescaped newline inside string starting at line ${stringStartPos.line}:${stringStartPos.col}`,
        });
      }
      currentLine++;
      currentCol = 1;
      isEscaped = false;
      continue;
    }

    if (inString) {
      if (isEscaped) {
        const validEscapes = ['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'];
        if (!validEscapes.includes(char)) {
          syntaxErrors.push({
            file,
            line: currentLine,
            col: currentCol,
            message: `Invalid escape character \\${char} at index ${i}`,
          });
        }
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
        stringStartPos = { line: currentLine, col: currentCol };
      } else if (char === '{' || char === '[') {
        bracketStack.push({ char, line: currentLine, col: currentCol, index: i });
      } else if (char === '}' || char === ']') {
        if (bracketStack.length === 0) {
          syntaxErrors.push({
            file,
            line: currentLine,
            col: currentCol,
            message: `Unexpected closing '${char}' with empty stack`,
          });
        } else {
          const top = bracketStack.pop();
          const expected = top.char === '{' ? '}' : ']';
          if (char !== expected) {
            syntaxErrors.push({
              file,
              line: currentLine,
              col: currentCol,
              message: `Mismatched closing '${char}', expected '${expected}' opened at line ${top.line}:${top.col}`,
            });
          }
        }
      }
    }
    currentCol++;
  }

  if (inString) {
    syntaxErrors.push({
      file,
      line: currentLine,
      col: currentCol,
      message: `File ended with unclosed string opened at line ${stringStartPos.line}:${stringStartPos.col}`,
    });
  }

  if (bracketStack.length > 0) {
    bracketStack.forEach((b) => {
      syntaxErrors.push({
        file,
        line: b.line,
        col: b.col,
        message: `Unclosed '${b.char}' opened at line ${b.line}:${b.col}`,
      });
    });
  }

  totalSyntaxErrors += syntaxErrors.length;
  if (syntaxErrors.length > 0) {
    console.error(`❌ ${file} has ${syntaxErrors.length} lexical/syntax errors!`);
    console.table(syntaxErrors);
  } else {
    console.log(`✓ ${file}: 0 lexical/syntax errors.`);
  }

  // --- Step 2: Object Parsing and Deep Field Checks ---
  let chapters;
  try {
    chapters = JSON.parse(raw);
  } catch (e) {
    console.error(`JSON.parse failed on ${file}:`, e.message);
    process.exit(1);
  }

  const subject = file.replace('.json', '');
  for (const [chapter, mcqs] of Object.entries(chapters)) {
    if (!Array.isArray(mcqs)) {
      allIssues.push({
        file,
        subject,
        chapter,
        id: 'N/A',
        issue: 'Chapter content is not an array of MCQs',
      });
      continue;
    }

    mcqs.forEach((mcq, idx) => {
      totalMCQs++;
      const id = mcq?.id || `MISSING_ID_${subject}_${chapter}_${idx}`;

      // Check ID
      if (!mcq.id || typeof mcq.id !== 'string' || mcq.id.trim() === '') {
        allIssues.push({ file, subject, chapter, index: idx, id, issue: 'Missing or invalid id' });
      } else {
        if (idMap.has(mcq.id)) {
          allIssues.push({
            file,
            subject,
            chapter,
            index: idx,
            id: mcq.id,
            issue: `Duplicate id detected (previously seen in ${idMap.get(mcq.id)})`,
          });
        } else {
          idMap.set(mcq.id, `${subject} -> ${chapter}`);
        }
      }

      // Check Question Text
      if (!mcq.question || typeof mcq.question !== 'string' || mcq.question.trim().length === 0) {
        allIssues.push({ file, subject, chapter, index: idx, id, issue: 'Missing or empty question text' });
      } else {
        const qText = mcq.question.trim();
        if (qText.endsWith('...') || qText.endsWith('…') || qText.endsWith('TODO') || qText.length < 5) {
          allIssues.push({ file, subject, chapter, index: idx, id, issue: `Question text appears truncated: "${qText}"` });
        }
        const dollarCount = (qText.match(/\$/g) || []).length;
        if (dollarCount % 2 !== 0) {
          allIssues.push({ file, subject, chapter, index: idx, id, issue: `Unbalanced LaTeX dollar delimiters in question: "${qText}"` });
        }
        const openBraces = (qText.match(/\{/g) || []).length;
        const closeBraces = (qText.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
          allIssues.push({ file, subject, chapter, index: idx, id, issue: `Unbalanced curly braces in LaTeX question: "${qText}"` });
        }
      }

      // Check Options
      if (!mcq.options || typeof mcq.options !== 'object') {
        allIssues.push({ file, subject, chapter, index: idx, id, issue: 'Missing options object' });
      } else {
        const opts = ['A', 'B', 'C', 'D'];
        const optValues = [];
        for (const optKey of opts) {
          const val = mcq.options[optKey];
          if (val === undefined || val === null || typeof val !== 'string' || val.trim().length === 0) {
            allIssues.push({ file, subject, chapter, index: idx, id, issue: `Option ${optKey} is missing, null, or empty` });
          } else {
            optValues.push(val.trim());
            if (val.trim().endsWith('...') || val.trim().endsWith('…')) {
              allIssues.push({ file, subject, chapter, index: idx, id, issue: `Option ${optKey} appears truncated: "${val}"` });
            }
            const dollarCount = (val.match(/\$/g) || []).length;
            if (dollarCount % 2 !== 0) {
              allIssues.push({ file, subject, chapter, index: idx, id, issue: `Option ${optKey} has unbalanced LaTeX dollar delimiters: "${val}"` });
            }
          }
        }
        if (optValues.length === 4) {
          const uniqueVals = new Set(optValues);
          if (uniqueVals.size < 4) {
            allIssues.push({ file, subject, chapter, index: idx, id, issue: `Duplicate option values found in choices: ${JSON.stringify(mcq.options)}` });
          }
        }
      }

      // Check Correct Answer
      if (!mcq.correctAnswer || !['A', 'B', 'C', 'D'].includes(mcq.correctAnswer)) {
        allIssues.push({ file, subject, chapter, index: idx, id, issue: `Invalid correctAnswer: "${mcq.correctAnswer}" (must be A, B, C, or D)` });
      }

      // Check Explanation
      if (!mcq.explanation || typeof mcq.explanation !== 'string' || mcq.explanation.trim().length === 0) {
        allIssues.push({ file, subject, chapter, index: idx, id, issue: 'Missing or empty explanation' });
      } else {
        const expText = mcq.explanation.trim();
        if (expText.endsWith('...') || expText.endsWith('…') || expText.length < 5) {
          allIssues.push({ file, subject, chapter, index: idx, id, issue: `Explanation appears truncated: "${expText}"` });
        }
        const dollarCount = (expText.match(/\$/g) || []).length;
        if (dollarCount % 2 !== 0) {
          allIssues.push({ file, subject, chapter, index: idx, id, issue: `Explanation has unbalanced LaTeX dollar delimiters: "${expText}"` });
        }
      }
    });
  }
}

console.log('\n=====================================================');
console.log(`TOTAL LEXICAL SYNTAX ERRORS: ${totalSyntaxErrors}`);
console.log(`TOTAL QUESTIONS AUDITED: ${totalMCQs}`);
console.log(`TOTAL STRUCTURAL/TRUNCATION ISSUES FOUND: ${allIssues.length}`);
console.log('=====================================================');

if (allIssues.length > 0) {
  console.log('\nList of issues found:');
  allIssues.forEach((iss, i) => {
    console.log(`[#${i + 1}] ID: ${iss.id} | File: ${iss.file} | Chapter: ${iss.chapter} | Issue: ${iss.issue}`);
  });
  process.exit(1);
} else {
  console.log('✓ All per-subject JSON files are 100% valid, untruncated, and fully intact!');
}
