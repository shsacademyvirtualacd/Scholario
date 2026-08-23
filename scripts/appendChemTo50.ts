import fs from "fs";
import path from "path";
import { CHEM_CHAPTERS_1_TO_10_BATCH50 } from "./data/chemFiftyBatchPart1";
import { CHEM_CHAPTERS_11_TO_19_BATCH50 } from "./data/chemFiftyBatchPart2";
import type { StoredMCQ } from "../src/types/questionBank";
import { serializeQuestionBankToJson } from "../src/lib/questionBankSerializer";

const JSON_BANK_PATH = path.resolve(process.cwd(), "src/data/grade9FbiseBank.json");
const TS_BANK_PATH = path.resolve(process.cwd(), "src/lib/fbise9QuestionsBank.ts");

console.log("===========================================================");
console.log(" Grade 9 FBISE Chemistry: Append 10 MCQs/Chapter (40 -> 50)");
console.log("===========================================================");

const combinedNewBatch: Record<string, StoredMCQ[]> = {
  ...CHEM_CHAPTERS_1_TO_10_BATCH50,
  ...CHEM_CHAPTERS_11_TO_19_BATCH50
};

const newChapterNames = Object.keys(combinedNewBatch);
console.log(`Step 1: Checking chapters in new batch (${newChapterNames.length} chapters)...`);
if (newChapterNames.length !== 19) {
  throw new Error(`Expected 19 chapters in new batch, found ${newChapterNames.length}`);
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
console.log(`✓ Validated all ${newTotalCount} new MCQs across 19 chapters.`);

console.log("Step 2: Reading existing JSON question bank...");
const existingJson = JSON.parse(fs.readFileSync(JSON_BANK_PATH, "utf-8"));
const existingChem = existingJson["Chemistry"];
if (!existingChem) {
  throw new Error("Chemistry subject not found in JSON bank!");
}

const existingChemChaps = Object.keys(existingChem);
console.log(`Found ${existingChemChaps.length} existing Chemistry chapters.`);
if (existingChemChaps.length !== 19) {
  throw new Error(`Expected 19 existing Chemistry chapters, found ${existingChemChaps.length}`);
}

let existingChemTotal = 0;
for (const [chName, list] of Object.entries(existingChem)) {
  const count = (list as any[]).length;
  existingChemTotal += count;
  if (count !== 40) {
    throw new Error(`Chapter "${chName}" currently has ${count} questions, expected exactly 40!`);
  }
}
console.log(`✓ Verified existing Chemistry count = ${existingChemTotal} (40 per chapter).`);

console.log("Step 3: Checking uniqueness against existing questions...");
const existingIds = new Set<string>();
const existingTexts = new Set<string>();

for (const [chName, list] of Object.entries(existingChem)) {
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
console.log("✓ All 190 new questions are distinct and unique.");

console.log("Step 4: Performing strict append-only merge to grade9FbiseBank.json...");
const updatedBank = { ...existingJson };
const updatedChem: Record<string, any[]> = {};

for (const chName of existingChemChaps) {
  const existingList = existingChem[chName] || [];
  const newItems = combinedNewBatch[chName];
  if (!newItems) {
    throw new Error(`No new batch items found for chapter "${chName}"!`);
  }
  updatedChem[chName] = [...existingList, ...newItems];
}
updatedBank["Chemistry"] = updatedChem;

// Verify non-Chemistry subjects are completely unchanged
for (const [subj, chs] of Object.entries(existingJson)) {
  if (subj !== "Chemistry") {
    if (JSON.stringify(updatedBank[subj]) !== JSON.stringify(existingJson[subj])) {
      throw new Error(`Subject ${subj} was unintentionally modified!`);
    }
  }
}
console.log("✓ Verified all other subjects (Physics, Biology, Mathematics, Urdu, Islamiat) are 100% untouched.");

let finalChemJsonCount = 0;
for (const [chName, list] of Object.entries(updatedChem)) {
  finalChemJsonCount += list.length;
  if (list.length !== 50) {
    throw new Error(`Chapter "${chName}" has ${list.length} MCQs, expected exactly 50!`);
  }
}
console.log(`✓ JSON Bank Chemistry count: ${finalChemJsonCount} (50 per chapter across 19 chapters).`);
fs.writeFileSync(JSON_BANK_PATH, serializeQuestionBankToJson(updatedBank, 2), "utf-8");
console.log(`✓ Successfully updated ${JSON_BANK_PATH}`);

console.log("===========================================================");
console.log(" APPEND-ONLY TASK COMPLETED SUCCESSFULLY ");
console.log(`Chemistry Final: ${finalChemJsonCount} MCQs (50 per chapter across 19 chapters)`);
console.log("===========================================================");
