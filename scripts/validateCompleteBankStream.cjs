const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../src/data/grade9FbiseBank.json');

console.log('=== Character-by-Character & Deep Structural Stream Validator ===');
console.log('Validating target:', FILE_PATH);

if (!fs.existsSync(FILE_PATH)) {
  console.error('File not found!');
  process.exit(1);
}

const raw = fs.readFileSync(FILE_PATH, 'utf-8');
console.log(`Read ${raw.length} bytes, ${raw.split('\n').length} lines.`);

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
      // Valid JSON escape chars: ", \, /, b, f, n, r, t, uXXXX
      const validEscapes = ['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'];
      if (!validEscapes.includes(char)) {
        syntaxErrors.push({
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
          line: currentLine,
          col: currentCol,
          message: `Unexpected closing '${char}' with empty stack`,
        });
      } else {
        const top = bracketStack.pop();
        const expected = top.char === '{' ? '}' : ']';
        if (char !== expected) {
          syntaxErrors.push({
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
    line: currentLine,
    col: currentCol,
    message: `File ended with unclosed string opened at line ${stringStartPos.line}:${stringStartPos.col}`,
  });
}

if (bracketStack.length > 0) {
  bracketStack.forEach((b) => {
    syntaxErrors.push({
      line: b.line,
      col: b.col,
      message: `Unclosed '${b.char}' opened at line ${b.line}:${b.col}`,
    });
  });
}

console.log(`Character-by-character lexical scan finished. Syntax errors: ${syntaxErrors.length}`);
if (syntaxErrors.length > 0) {
  console.table(syntaxErrors);
}

// --- Step 2: Line index mapping for deep object position tracking ---
// Build line-offset array to map object positions to exact line numbers
const lineOffsets = [0];
for (let i = 0; i < raw.length; i++) {
  if (raw[i] === '\n') lineOffsets.push(i + 1);
}

function getLineNumberFromIndex(idx) {
  let low = 0;
  let high = lineOffsets.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lineOffsets[mid] <= idx) {
      if (mid === lineOffsets.length - 1 || lineOffsets[mid + 1] > idx) {
        return mid + 1;
      }
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return 1;
}

// --- Step 3: Deep Object & Field Structural Validation ---
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error('JSON.parse failed completely:', e.message);
  process.exit(1);
}

const subjects = Object.keys(data);
console.log(`Subjects present: ${subjects.length} (${subjects.join(', ')})`);

const idMap = new Map();
const allIssues = [];
let totalMCQs = 0;

for (const subject of subjects) {
  const chapters = data[subject];
  if (!chapters || typeof chapters !== 'object') {
    allIssues.push({
      subject,
      chapter: 'N/A',
      id: 'N/A',
      issue: 'Subject root is not an object',
    });
    continue;
  }

  for (const [chapter, mcqs] of Object.entries(chapters)) {
    if (!Array.isArray(mcqs)) {
      allIssues.push({
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
        allIssues.push({ subject, chapter, index: idx, id, issue: 'Missing or invalid id' });
      } else {
        if (idMap.has(mcq.id)) {
          allIssues.push({
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
        allIssues.push({ subject, chapter, index: idx, id, issue: 'Missing or empty question text' });
      } else {
        const qText = mcq.question.trim();
        // Check for truncation signs
        if (qText.endsWith('...') || qText.endsWith('…') || qText.endsWith('TODO') || qText.length < 5) {
          allIssues.push({ subject, chapter, index: idx, id, issue: `Question text appears truncated or too short: "${qText}"` });
        }
        // Check LaTeX delimiter balance in question
        const dollarCount = (qText.match(/\$/g) || []).length;
        if (dollarCount % 2 !== 0) {
          allIssues.push({ subject, chapter, index: idx, id, issue: `Unbalanced LaTeX dollar delimiters in question: "${qText}"` });
        }
        // Check unclosed LaTeX braces
        const openBraces = (qText.match(/\{/g) || []).length;
        const closeBraces = (qText.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
          allIssues.push({ subject, chapter, index: idx, id, issue: `Unbalanced curly braces in LaTeX question: "${qText}"` });
        }
      }

      // Check Options
      if (!mcq.options || typeof mcq.options !== 'object') {
        allIssues.push({ subject, chapter, index: idx, id, issue: 'Missing options object' });
      } else {
        const opts = ['A', 'B', 'C', 'D'];
        const optValues = [];
        for (const optKey of opts) {
          const val = mcq.options[optKey];
          if (val === undefined || val === null || typeof val !== 'string' || val.trim().length === 0) {
            allIssues.push({ subject, chapter, index: idx, id, issue: `Option ${optKey} is missing, null, or empty` });
          } else {
            optValues.push(val.trim());
            if (val.trim().endsWith('...') || val.trim().endsWith('…')) {
              allIssues.push({ subject, chapter, index: idx, id, issue: `Option ${optKey} appears truncated: "${val}"` });
            }
            // Check LaTeX delimiter balance in option
            const dollarCount = (val.match(/\$/g) || []).length;
            if (dollarCount % 2 !== 0) {
              allIssues.push({ subject, chapter, index: idx, id, issue: `Option ${optKey} has unbalanced LaTeX dollar delimiters: "${val}"` });
            }
          }
        }
        if (optValues.length === 4) {
          const uniqueVals = new Set(optValues);
          if (uniqueVals.size < 4) {
            allIssues.push({ subject, chapter, index: idx, id, issue: `Duplicate option values found in choices: ${JSON.stringify(mcq.options)}` });
          }
        }
      }

      // Check Correct Answer
      if (!mcq.correctAnswer || !['A', 'B', 'C', 'D'].includes(mcq.correctAnswer)) {
        allIssues.push({ subject, chapter, index: idx, id, issue: `Invalid correctAnswer: "${mcq.correctAnswer}" (must be A, B, C, or D)` });
      }

      // Check Explanation
      if (!mcq.explanation || typeof mcq.explanation !== 'string' || mcq.explanation.trim().length === 0) {
        allIssues.push({ subject, chapter, index: idx, id, issue: 'Missing or empty explanation' });
      } else {
        const expText = mcq.explanation.trim();
        if (expText.endsWith('...') || expText.endsWith('…') || expText.length < 5) {
          allIssues.push({ subject, chapter, index: idx, id, issue: `Explanation appears truncated: "${expText}"` });
        }
        const dollarCount = (expText.match(/\$/g) || []).length;
        if (dollarCount % 2 !== 0) {
          allIssues.push({ subject, chapter, index: idx, id, issue: `Explanation has unbalanced LaTeX dollar delimiters: "${expText}"` });
        }
      }
    });
  }
}

console.log('=====================================================');
console.log(`TOTAL QUESTIONS AUDITED: ${totalMCQs}`);
console.log(`TOTAL STRUCTURAL/TRUNCATION ISSUES FOUND: ${allIssues.length}`);
console.log('=====================================================');

if (allIssues.length > 0) {
  console.log('\nList of issues found:');
  allIssues.forEach((iss, i) => {
    console.log(`[#${i + 1}] ID: ${iss.id} | Subject: ${iss.subject} | Chapter: ${iss.chapter} | Issue: ${iss.issue}`);
  });
} else {
  console.log('✓ Zero (0) malformed, truncated, or broken MCQ entries detected across all subjects!');
}
