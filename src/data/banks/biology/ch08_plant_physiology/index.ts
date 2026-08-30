import type { StoredMCQ, StoredShortQuestion, StoredLongQuestion } from "../../../../types/questionBank";
import rawBankData from "../../../grade9FbiseBank.json";

export const chapterMetadata = {
  subject: "Biology",
  chapterName: "Plant Physiology",
  chapterNumber: 8,
  slug: "ch08_plant_physiology",
};

const bioBank = (rawBankData as any)?.Biology || {};
export const mcqs: StoredMCQ[] = bioBank["Plant Physiology"] || [];
export const shortQuestions: StoredShortQuestion[] = [];
export const longQuestions: StoredLongQuestion[] = [];

export default {
  metadata: chapterMetadata,
  mcqs,
  shortQuestions,
  longQuestions,
};

