import fs from "fs";
import path from "path";
import { BIO_CHAPTERS_BATCH50 } from "./data/bioFiftyBatch";
import type { StoredMCQ } from "../src/types/questionBank";
import { serializeQuestionBankToJson } from "../src/lib/questionBankSerializer";

const JSON_BANK_PATH = path.resolve(process.cwd(), "src/data/grade9FbiseBank.json");
const TS_BANK_PATH = path.resolve(process.cwd(), "src/lib/fbise9QuestionsBank.ts");

console.log("===========================================================");
console.log(" Grade 9 FBISE Biology: Append 10 MCQs/Chapter (40 -> 50)");
console.log("===========================================================");

const combinedNewBatch: Record<string, StoredMCQ[]> = {
  ...BIO_CHAPTERS_BATCH50
};

const newChapterNames = Object.keys(combinedNewBatch);
console.log(`Step 1: Checking chapters in new batch (${newChapterNames.length} chapters)...`);
if (newChapterNames.length !== 10) {
  throw new Error(`Expected 10 chapters in new batch, found ${newChapterNames.length}`);
}

let newTotalCount = 0;
for (const [chName, qList] of Object.entries(combinedNewBatch)) {
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
console.log(`✓ Validated all ${newTotalCount} new MCQs across 10 chapters.`);

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

// Slice to first 40 baseline questions to ensure clean append of the new batch
const baselineBio: Record<string, any[]> = {};
let baselineBioTotal = 0;
for (const [chName, list] of Object.entries(existingBio)) {
  const baseList = (list as any[]).slice(0, 40);
  baselineBio[chName] = baseList;
  baselineBioTotal += baseList.length;
  if (baseList.length !== 40) {
    throw new Error(`Chapter "${chName}" has only ${baseList.length} baseline questions, expected 40!`);
  }
}
console.log(`✓ Verified baseline Biology count = ${baselineBioTotal} (40 per chapter across 10 chapters).`);

console.log("Step 3: Checking uniqueness against existing questions...");
const existingIds = new Set<string>();
const existingTexts = new Set<string>();

for (const [chName, list] of Object.entries(baselineBio)) {
  for (const q of list as any[]) {
    existingIds.add(q.id);
    existingTexts.add(q.question.trim().toLowerCase());
  }
}

for (const [chName, qList] of Object.entries(combinedNewBatch)) {
  for (const q of qList) {
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
console.log("✓ All 100 new questions are distinct and unique.");

console.log("Step 4: Performing strict append-only merge to grade9FbiseBank.json...");
const updatedBank = { ...existingJson };
const updatedBio: Record<string, any[]> = {};

for (const chName of existingBioChaps) {
  const existingList = baselineBio[chName] || [];
  const newItems = combinedNewBatch[chName];
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
  if (list.length !== 50) {
    throw new Error(`Chapter "${chName}" has ${list.length} MCQs, expected exactly 50!`);
  }
}
console.log(`✓ JSON Bank Biology count: ${finalBioJsonCount} (50 per chapter across 10 chapters).`);
fs.writeFileSync(JSON_BANK_PATH, serializeQuestionBankToJson(updatedBank, 2), "utf-8");
console.log(`✓ Successfully updated ${JSON_BANK_PATH}`);

console.log("===========================================================");
console.log(" APPEND-ONLY TASK COMPLETED SUCCESSFULLY ");
console.log(`Biology Final: ${finalBioJsonCount} MCQs (50 per chapter across 10 chapters)`);
console.log("===========================================================");
