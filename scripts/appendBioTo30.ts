import fs from "fs";
import path from "path";
import { BIO_CHAPTERS_BATCH30 } from "./data/bioThirtyBatch";
import type { StoredMCQ } from "../src/types/questionBank";

const JSON_BANK_PATH = path.resolve(process.cwd(), "src/data/grade9FbiseBank.json");
const TS_BANK_PATH = path.resolve(process.cwd(), "src/lib/fbise9QuestionsBank.ts");

console.log("===========================================================");
console.log(" Grade 9 FBISE Biology: Append 10 MCQs/Chapter (20 -> 30)");
console.log("===========================================================");

const newChapterNames = Object.keys(BIO_CHAPTERS_BATCH30);
console.log(`Step 1: Checking chapters in new batch (${newChapterNames.length} chapters)...`);
if (newChapterNames.length !== 10) {
  throw new Error(`Expected 10 chapters in new batch, found ${newChapterNames.length}`);
}

let newTotalCount = 0;
for (const [chName, qList] of Object.entries(BIO_CHAPTERS_BATCH30)) {
  if (qList.length !== 10) {
    throw new Error(`Chapter "${chName}" in batch has ${qList.length} questions, expected exactly 10!`);
  }
  newTotalCount += qList.length;
  for (const q of qList) {
    if (!q.id || !q.question || !q.options || !q.correctAnswer || !q.explanation) {
      throw new Error(`Question ${q.id} in "${chName}" is missing required fields!`);
    }
    const optKeys = Object.keys(q.options);
    if (optKeys.length !== 4 || !['A', 'B', 'C', 'D'].every(k => optKeys.includes(k))) {
      throw new Error(`Question ${q.id} does not have exactly A, B, C, D options!`);
    }
    if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
      throw new Error(`Question ${q.id} has invalid correctAnswer: ${q.correctAnswer}`);
    }
  }
}
console.log(`✓ Validated all ${newTotalCount} new MCQs across 10 Biology chapters.`);

console.log("Step 2: Reading existing JSON question bank...");
const existingJson = JSON.parse(fs.readFileSync(JSON_BANK_PATH, "utf-8"));
const existingBio = existingJson["Biology"];
if (!existingBio) {
  throw new Error("Biology subject not found in JSON bank!");
}

const existingBioChaps = Object.keys(existingBio);
console.log(`Found ${existingBioChaps.length} existing Biology chapters.`);
if (existingBioChaps.length !== 10) {
  throw new Error(`Expected 10 existing Biology chapters, found ${existingBioChaps.length}`);
}

let existingBioTotal = 0;
for (const [chName, list] of Object.entries(existingBio)) {
  const count = (list as any[]).length;
  existingBioTotal += count;
  if (count !== 20) {
    throw new Error(`Chapter "${chName}" currently has ${count} questions, expected exactly 20!`);
  }
}
console.log(`✓ Verified existing Biology count = ${existingBioTotal} (20 per chapter across 10 chapters).`);

console.log("Step 3: Checking uniqueness against existing questions in this chapter & subject...");
for (const chName of existingBioChaps) {
  const existingList = existingBio[chName] as any[];
  const existingIds = new Set(existingList.map(q => q.id));
  const existingTexts = new Set(existingList.map(q => q.question.trim().toLowerCase()));

  const newItems = BIO_CHAPTERS_BATCH30[chName];
  if (!newItems) {
    throw new Error(`Missing batch for chapter: ${chName}`);
  }

  for (const q of newItems) {
    if (existingIds.has(q.id)) {
      throw new Error(`Duplicate ID detected: ${q.id} in chapter "${chName}"`);
    }
    if (existingTexts.has(q.question.trim().toLowerCase())) {
      throw new Error(`Duplicate question text detected: "${q.question}" in chapter "${chName}"`);
    }
    existingIds.add(q.id);
    existingTexts.add(q.question.trim().toLowerCase());
  }
}
console.log("✓ All 100 new questions are distinct and unique within their chapters.");

console.log("Step 4: Performing strict append-only merge to grade9FbiseBank.json...");
const updatedBank = { ...existingJson };
const updatedBio: Record<string, any[]> = {};

for (const chName of existingBioChaps) {
  const existingList = existingBio[chName] || [];
  const newItems = BIO_CHAPTERS_BATCH30[chName];
  if (!newItems) {
    throw new Error(`No new batch items found for chapter "${chName}"!`);
  }
  updatedBio[chName] = [...existingList, ...newItems];
}
updatedBank["Biology"] = updatedBio;

// Verify non-Biology subjects are completely unchanged
for (const [subj, chs] of Object.entries(existingJson)) {
  if (subj !== "Biology") {
    if (JSON.stringify(updatedBank[subj]) !== JSON.stringify(existingJson[subj])) {
      throw new Error(`Subject ${subj} was unintentionally modified!`);
    }
  }
}
console.log("✓ Verified all other subjects (Physics, Chemistry, Mathematics, Urdu, Islamiat) are 100% untouched.");

let finalBioJsonCount = 0;
for (const [chName, list] of Object.entries(updatedBio)) {
  finalBioJsonCount += list.length;
  if (list.length !== 30) {
    throw new Error(`Chapter "${chName}" has ${list.length} MCQs, expected exactly 30!`);
  }
}
console.log(`✓ JSON Bank Biology count: ${finalBioJsonCount} (30 per chapter across 10 chapters).`);
fs.writeFileSync(JSON_BANK_PATH, JSON.stringify(updatedBank, null, 2), "utf-8");
console.log(`✓ Successfully updated ${JSON_BANK_PATH}`);

console.log("Step 5: Updating TypeScript question bank file src/lib/fbise9QuestionsBank.ts...");
const helperFunctions = `
export function getFbise9QuestionCount(subject?: string): number {
  if (subject && FBISE_9_QUESTION_BANK[subject]) {
    return Object.values(FBISE_9_QUESTION_BANK[subject]).reduce(
      (sum, list) => sum + list.length,
      0
    );
  }
  return Object.values(FBISE_9_QUESTION_BANK).reduce(
    (subjSum, chapters) =>
      subjSum +
      Object.values(chapters).reduce((chSum, list) => chSum + list.length, 0),
    0
  );
}

export function getFbise9QuestionsByChapter(
  subject: string,
  chapter: string
): MCQQuestion[] {
  return FBISE_9_QUESTION_BANK[subject]?.[chapter] || [];
}

export function getRandomFbise9Questions(
  subject: string,
  chapter: string,
  count: number,
  difficulty?: MCQDifficulty | "mixed"
): MCQQuestion[] {
  const all = getFbise9QuestionsByChapter(subject, chapter);
  let pool = all;
  if (difficulty && difficulty !== "mixed") {
    const diffFiltered = pool.filter((q) => q.difficulty === difficulty);
    if (diffFiltered.length >= count) {
      pool = diffFiltered;
    }
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getGrade9FBISEQuestions(
  subject: string,
  chapters: string[] = [],
  count: number = 10,
  difficulty?: MCQDifficulty | "mixed",
  excludeTexts: string[] = []
): MCQQuestion[] {
  const normSub = (subject || "").trim();
  const subBank =
    FBISE_9_QUESTION_BANK[normSub] ||
    Object.entries(FBISE_9_QUESTION_BANK).find(
      ([k]) => k.toLowerCase() === normSub.toLowerCase()
    )?.[1];

  if (!subBank) return [];

  let pool: MCQQuestion[] = [];
  if (chapters && chapters.length > 0) {
    for (const ch of chapters) {
      const trimmed = ch.trim();
      if (subBank[trimmed]) {
        pool.push(...subBank[trimmed]);
      } else {
        for (const [k, qs] of Object.entries(subBank)) {
          if (
            k.toLowerCase().includes(trimmed.toLowerCase()) ||
            trimmed.toLowerCase().includes(k.toLowerCase())
          ) {
            pool.push(...qs);
          }
        }
      }
    }
  } else {
    for (const qs of Object.values(subBank)) {
      pool.push(...qs);
    }
  }

  if (excludeTexts && excludeTexts.length > 0) {
    const excludeSet = new Set(excludeTexts.map((t) => t.trim().toLowerCase()));
    pool = pool.filter((q) => !excludeSet.has(q.question.trim().toLowerCase()));
  }

  if (difficulty && difficulty !== "mixed") {
    const diffFiltered = pool.filter((q) => q.difficulty === difficulty);
    if (diffFiltered.length >= count) {
      pool = diffFiltered;
    }
  }

  const seen = new Set<string>();
  const uniquePool: MCQQuestion[] = [];
  for (const q of pool) {
    if (!seen.has(q.id)) {
      seen.add(q.id);
      uniquePool.push(q);
    }
  }

  const shuffled = [...uniquePool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
`;

const tsContent = `// Auto-generated FBISE Grade 9 Question Bank
import type { MCQQuestion, MCQDifficulty } from "../types/selfTest";

export const FBISE_9_QUESTION_BANK: Record<string, Record<string, MCQQuestion[]>> = ${JSON.stringify(updatedBank, null, 2)};
` + helperFunctions;

fs.writeFileSync(TS_BANK_PATH, tsContent, "utf-8");
console.log(`✓ Successfully updated ${TS_BANK_PATH}`);

console.log("===========================================================");
console.log(" APPEND-ONLY TASK COMPLETED SUCCESSFULLY ");
console.log(`Biology Final: ${finalBioJsonCount} MCQs (30 per chapter across 10 chapters)`);
console.log("===========================================================");
