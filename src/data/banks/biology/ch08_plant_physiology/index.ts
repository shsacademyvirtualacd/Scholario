import type { StoredMCQ, StoredShortQuestion, StoredLongQuestion } from "../../../../types/questionBank";
import { biologyMCQs } from "../../biologyData";

export const chapterMetadata = {
  subject: "Biology",
  chapterName: "Plant Physiology",
  chapterNumber: 8,
  slug: "ch08_plant_physiology",
};

export const mcqs: StoredMCQ[] = biologyMCQs["Plant Physiology"] || [];
export const shortQuestions: StoredShortQuestion[] = [];
export const longQuestions: StoredLongQuestion[] = [];

export default {
  metadata: chapterMetadata,
  mcqs,
  shortQuestions,
  longQuestions,
};

