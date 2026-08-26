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

export const biology: Record<string, StoredMCQ[]> = {
  "The Science of Biology": ch01 as unknown as StoredMCQ[],
  "Molecular Biology": ch02 as unknown as StoredMCQ[],
  "The Cell": ch03 as unknown as StoredMCQ[],
  "Tissues, Organs and Organ Systems": ch04 as unknown as StoredMCQ[],
  "Cell Cycle": ch05 as unknown as StoredMCQ[],
  "Biodiversity": ch06 as unknown as StoredMCQ[],
  "Metabolism": ch07 as unknown as StoredMCQ[],
  "Plant Physiology": ch08 as unknown as StoredMCQ[],
  "Plant Reproduction": ch09 as unknown as StoredMCQ[],
  "Evolution": ch10 as unknown as StoredMCQ[],
};

export default biology;
