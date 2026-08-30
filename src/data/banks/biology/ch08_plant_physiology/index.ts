import type { StoredMCQ, StoredShortQuestion, StoredLongQuestion } from "../../../../types/questionBank";
import mcqsJson from "./mcqs.json";
import shortQuestionsJson from "./short_questions.json";
import longQuestionsJson from "./long_questions.json";

export const chapterMetadata = {
  subject: "Biology",
  chapterName: "Plant Physiology",
  chapterNumber: 8,
  slug: "ch08_plant_physiology",
};

export const mcqs: StoredMCQ[] = mcqsJson as unknown as StoredMCQ[];
export const shortQuestions: StoredShortQuestion[] = shortQuestionsJson as unknown as StoredShortQuestion[];
export const longQuestions: StoredLongQuestion[] = longQuestionsJson as unknown as StoredLongQuestion[];

export default {
  metadata: chapterMetadata,
  mcqs,
  shortQuestions,
  longQuestions,
};
