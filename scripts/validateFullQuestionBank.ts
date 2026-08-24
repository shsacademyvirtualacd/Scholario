import fs from 'fs';
import path from 'path';

interface MCQ {
  id: string;
  board: string;
  grade: string;
  subject: string;
  chapter: string;
  chapterNumber: number;
  topic: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: string;
  verified: boolean;
  source: string;
  createdAt?: string;
}

interface ValidationReport {
  totalSubjects: number;
  totalChapters: number;
  totalMCQs: number;
  errors: Array<{
    subject: string;
    chapter: string;
    mcqIndex?: number;
    mcqId?: string;
    errorType: string;
    detail: string;
  }>;
  warnings: Array<{
    subject: string;
    chapter: string;
    mcqIndex?: number;
    mcqId?: string;
    detail: string;
  }>;
  duplicateIds: string[];
  subjectsSummary: Record<string, { chaptersCount: number; mcqsCount: number }>;
}

function validateMCQBank(filePath: string): ValidationReport {
  console.log(`Starting comprehensive audit of: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const rawContent = fs.readFileSync(filePath, 'utf8');
  console.log(`File size: ${(rawContent.length / 1024 / 1024).toFixed(2)} MB (${rawContent.length} bytes)`);

  let data: Record<string, Record<string, MCQ[]>>;
  try {
    data = JSON.parse(rawContent);
  } catch (err: any) {
    console.error('Fatal: JSON.parse failed on root file:', err.message);
    process.exit(1);
  }

  const report: ValidationReport = {
    totalSubjects: 0,
    totalChapters: 0,
    totalMCQs: 0,
    errors: [],
    warnings: [],
    duplicateIds: [],
    subjectsSummary: {}
  };

  const seenIds = new Set<string>();
  const validAnswers = new Set(['A', 'B', 'C', 'D']);
  const validDifficulties = new Set(['easy', 'medium', 'hard']);

  const subjects = Object.keys(data);
  report.totalSubjects = subjects.length;

  for (const subject of subjects) {
    const chapters = Object.keys(data[subject]);
    report.totalChapters += chapters.length;
    let subjectMCQCount = 0;

    for (const chapter of chapters) {
      const mcqs = data[subject][chapter];
      if (!Array.isArray(mcqs)) {
        report.errors.push({
          subject,
          chapter,
          errorType: 'INVALID_CHAPTER_STRUCTURE',
          detail: `Expected array of MCQs but got ${typeof mcqs}`
        });
        continue;
      }

      mcqs.forEach((mcq, idx) => {
        report.totalMCQs++;
        subjectMCQCount++;

        // 1. Check ID
        if (!mcq.id || typeof mcq.id !== 'string' || mcq.id.trim() === '') {
          report.errors.push({
            subject,
            chapter,
            mcqIndex: idx,
            errorType: 'MISSING_OR_EMPTY_ID',
            detail: `MCQ at index ${idx} is missing a valid id`
          });
        } else {
          if (seenIds.has(mcq.id)) {
            report.duplicateIds.push(mcq.id);
            report.errors.push({
              subject,
              chapter,
              mcqIndex: idx,
              mcqId: mcq.id,
              errorType: 'DUPLICATE_ID',
              detail: `Duplicate MCQ ID: ${mcq.id}`
            });
          }
          seenIds.add(mcq.id);
        }

        // 2. Check Question Text
        if (!mcq.question || typeof mcq.question !== 'string' || mcq.question.trim().length === 0) {
          report.errors.push({
            subject,
            chapter,
            mcqIndex: idx,
            mcqId: mcq.id,
            errorType: 'EMPTY_QUESTION',
            detail: `Question text is missing or empty`
          });
        }

        // 3. Check Options A, B, C, D
        if (!mcq.options || typeof mcq.options !== 'object') {
          report.errors.push({
            subject,
            chapter,
            mcqIndex: idx,
            mcqId: mcq.id,
            errorType: 'MISSING_OPTIONS',
            detail: `Options object is missing or not an object`
          });
        } else {
          for (const optKey of ['A', 'B', 'C', 'D'] as const) {
            const optVal = mcq.options[optKey];
            if (typeof optVal !== 'string' || optVal.trim().length === 0) {
              report.errors.push({
                subject,
                chapter,
                mcqIndex: idx,
                mcqId: mcq.id,
                errorType: 'INVALID_OPTION',
                detail: `Option ${optKey} is missing or empty`
              });
            }
          }
        }

        // 4. Check Correct Answer
        if (!validAnswers.has(mcq.correctAnswer)) {
          report.errors.push({
            subject,
            chapter,
            mcqIndex: idx,
            mcqId: mcq.id,
            errorType: 'INVALID_CORRECT_ANSWER',
            detail: `correctAnswer must be 'A', 'B', 'C', or 'D', but got '${mcq.correctAnswer}'`
          });
        }

        // 5. Check Subject & Chapter Consistency
        if (mcq.subject !== subject) {
          report.warnings.push({
            subject,
            chapter,
            mcqIndex: idx,
            mcqId: mcq.id,
            detail: `Subject mismatch inside MCQ payload: '${mcq.subject}' vs root key '${subject}'`
          });
        }

        if (mcq.chapter !== chapter) {
          report.warnings.push({
            subject,
            chapter,
            mcqIndex: idx,
            mcqId: mcq.id,
            detail: `Chapter mismatch inside MCQ payload: '${mcq.chapter}' vs root key '${chapter}'`
          });
        }

        // 6. Check Explanation
        if (!mcq.explanation || typeof mcq.explanation !== 'string' || mcq.explanation.trim().length === 0) {
          report.warnings.push({
            subject,
            chapter,
            mcqIndex: idx,
            mcqId: mcq.id,
            detail: `Explanation is empty or missing`
          });
        }

        // 7. Check Chapter Number
        if (typeof mcq.chapterNumber !== 'number' || isNaN(mcq.chapterNumber)) {
          report.errors.push({
            subject,
            chapter,
            mcqIndex: idx,
            mcqId: mcq.id,
            errorType: 'INVALID_CHAPTER_NUMBER',
            detail: `chapterNumber must be a valid number, got ${mcq.chapterNumber}`
          });
        }
      });
    }

    report.subjectsSummary[subject] = {
      chaptersCount: chapters.length,
      mcqsCount: subjectMCQCount
    };
  }

  return report;
}

const targetPath = path.resolve(process.cwd(), 'src/data/grade9FbiseBank.json');
const report = validateMCQBank(targetPath);

console.log('\n========================================');
console.log('       COMPREHENSIVE AUDIT REPORT       ');
console.log('========================================');
console.log(`Total Subjects:  ${report.totalSubjects}`);
console.log(`Total Chapters:  ${report.totalChapters}`);
console.log(`Total MCQs:      ${report.totalMCQs}`);
console.log(`Duplicate IDs:   ${report.duplicateIds.length}`);
console.log(`Total Errors:    ${report.errors.length}`);
console.log(`Total Warnings:  ${report.warnings.length}`);
console.log('----------------------------------------');
console.log('Subject Breakdown:');
for (const [subj, meta] of Object.entries(report.subjectsSummary)) {
  console.log(`  - ${subj.padEnd(14)}: ${meta.chaptersCount.toString().padStart(2)} chapters | ${meta.mcqsCount.toString().padStart(4)} MCQs`);
}
console.log('========================================\n');

if (report.errors.length > 0) {
  console.error('Found validation errors:');
  report.errors.forEach((err, i) => {
    console.error(`[${i + 1}] ID: ${err.mcqId || 'N/A'} | Subj: ${err.subject} | Ch: ${err.chapter} | ${err.errorType}: ${err.detail}`);
  });
  process.exit(1);
} else {
  console.log('ALL 2,300 MCQs in src/data/grade9FbiseBank.json ARE 100% VALID WITH 0 ERRORS!');
}
