import { IELTS_GRAMMAR_MCQS, ieltsBank, ieltsMasterBank, ALL_IELTS_MCQS } from '../src/data/banks/index';

console.log('=== VERIFYING 1,500 IELTS GRAMMAR MCQ BANK ===\n');

// 1. Array length verification
console.log(`Total IELTS_GRAMMAR_MCQS: ${IELTS_GRAMMAR_MCQS.length}`);
if (IELTS_GRAMMAR_MCQS.length !== 1500) {
  console.error(`ERROR: Expected 1500 questions, got ${IELTS_GRAMMAR_MCQS.length}`);
  process.exit(1);
}

console.log(`Total ALL_IELTS_MCQS: ${ALL_IELTS_MCQS.length}`);
if (ALL_IELTS_MCQS.length !== 1500) {
  console.error(`ERROR: Expected 1500 questions in ALL_IELTS_MCQS, got ${ALL_IELTS_MCQS.length}`);
  process.exit(1);
}

// 2. IELTS Bank verification
const grammarChapter = ieltsBank['Grammar']['Grammar & Sentence Structure'];
console.log(`ieltsBank['Grammar']['Grammar & Sentence Structure']: ${grammarChapter.length} questions`);
if (grammarChapter.length !== 1500) {
  console.error(`ERROR: Expected 1500 questions in grammar chapter, got ${grammarChapter.length}`);
  process.exit(1);
}

// 3. Schema & Uniqueness validation
const allIds = new Set<string>();
const answerCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
const topicCounts: Record<string, number> = {};

for (let i = 0; i < IELTS_GRAMMAR_MCQS.length; i++) {
  const q = IELTS_GRAMMAR_MCQS[i];
  if (allIds.has(q.id)) {
    console.error(`ERROR: Duplicate ID found: ${q.id}`);
    process.exit(1);
  }
  allIds.add(q.id);
  
  if (!q.question || q.question.trim().length < 10) {
    console.error(`ERROR: Question text too short in ${q.id}`);
    process.exit(1);
  }
  if (!q.options || !q.options.A || !q.options.B || !q.options.C || !q.options.D) {
    console.error(`ERROR: Missing options in ${q.id}`);
    process.exit(1);
  }
  if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
    console.error(`ERROR: Invalid correctAnswer in ${q.id}: ${q.correctAnswer}`);
    process.exit(1);
  }
  answerCounts[q.correctAnswer]++;
  const t = q.topic || 'Unknown';
  topicCounts[t] = (topicCounts[t] || 0) + 1;

  if (!q.explanation || q.explanation.trim().length < 10) {
    console.error(`ERROR: Explanation too short in ${q.id}`);
    process.exit(1);
  }
  if (q.board !== 'ielts') {
    console.error(`ERROR: Invalid board in ${q.id}: ${q.board}`);
    process.exit(1);
  }
  if (q.subject !== 'Grammar') {
    console.error(`ERROR: Invalid subject in ${q.id}: ${q.subject}`);
    process.exit(1);
  }
}

console.log('✓ All 1,500 questions pass strict schema validation.');
console.log('\nAnswer distribution:', answerCounts);
console.log('\nTopic breakdown:');
Object.entries(topicCounts).sort((a,b) => b[1] - a[1]).forEach(([t, count]) => {
  console.log(`  - ${t}: ${count} questions`);
});

// 4. Spot check 15 questions from batch 3 (1001-1500)
console.log('\n--- SPOT CHECKING 15 QUESTIONS FROM BATCH 3 (1001-1500) ---');
const sampleIndices = [1001, 1046, 1096, 1141, 1186, 1226, 1271, 1316, 1361, 1406, 1446, 1471, 1025, 1250, 1499];

sampleIndices.forEach((idxNum, i) => {
  const targetId = `ielts-gram-${idxNum}`;
  const q = IELTS_GRAMMAR_MCQS.find(item => item.id === targetId);
  if (!q) {
    console.error(`ERROR: Could not find ${targetId}`);
    process.exit(1);
  }
  console.log(`\nSample ${i + 1} [${q.id}] (${q.topic} - ${q.difficulty}):`);
  console.log(`  Q: ${q.question.substring(0, 95)}...`);
  console.log(`  Ans: ${q.correctAnswer} -> ${q.options[q.correctAnswer]}`);
  console.log(`  Exp: ${q.explanation.substring(0, 85)}...`);
});

console.log('\n======================================================');
console.log('✓ ALL 1,500 IELTS GRAMMAR QUESTIONS SUCCESSFULLY VERIFIED');
console.log('======================================================');
