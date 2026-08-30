import type { StoredMCQ } from "../../../types/questionBank";
import ch01 from "./ch01.json";
import ch02 from "./ch02.json";
import ch03 from "./ch03.json";
import ch04 from "./ch04.json";
import ch05 from "./ch05.json";
import ch06 from "./ch06.json";
import ch07 from "./ch07.json";
import ch08 from "./ch08.json";
import ch09 from "./ch09.json";
import ch10 from "./ch10.json";
import ch11 from "./ch11.json";
import ch12 from "./ch12.json";
import ch13 from "./ch13.json";
import ch14 from "./ch14.json";
import ch15 from "./ch15.json";
import ch16 from "./ch16.json";
import ch17 from "./ch17.json";

export const english: Record<string, StoredMCQ[]> = {
  "Parts of Speech": ch01 as unknown as StoredMCQ[],
  "Tenses (all forms)": ch02 as unknown as StoredMCQ[],
  "Active & Passive Voice": ch03 as unknown as StoredMCQ[],
  "Direct & Indirect Narration": ch04 as unknown as StoredMCQ[],
  "Sentence Correction": ch05 as unknown as StoredMCQ[],
  "Types of Sentences": ch06 as unknown as StoredMCQ[],
  "Subject-Verb Agreement": ch07 as unknown as StoredMCQ[],
  "Prepositions": ch08 as unknown as StoredMCQ[],
  "Conjunctions": ch09 as unknown as StoredMCQ[],
  "Articles": ch10 as unknown as StoredMCQ[],
  "Punctuation": ch11 as unknown as StoredMCQ[],
  "Modals/Auxiliary Verbs": ch12 as unknown as StoredMCQ[],
  "Clauses": ch13 as unknown as StoredMCQ[],
  "Degrees of Comparison": ch14 as unknown as StoredMCQ[],
  "Vocabulary & Comprehension": ch15 as unknown as StoredMCQ[],
  "Idioms & Phrases": ch16 as unknown as StoredMCQ[],
  "Word Formation (Prefixes/Suffixes)": ch17 as unknown as StoredMCQ[],
};

export default english;
