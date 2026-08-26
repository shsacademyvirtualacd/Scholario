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
import ch18 from "./ch18.json";
import ch19 from "./ch19.json";

export const chemistry: Record<string, StoredMCQ[]> = {
  "Nature of Science in Chemistry": ch01 as unknown as StoredMCQ[],
  "Matter": ch02 as unknown as StoredMCQ[],
  "Atomic Structure": ch03 as unknown as StoredMCQ[],
  "Periodic Table and Periodicity of Properties": ch04 as unknown as StoredMCQ[],
  "Chemical Bonding": ch05 as unknown as StoredMCQ[],
  "Stoichiometry": ch06 as unknown as StoredMCQ[],
  "Electrochemistry": ch07 as unknown as StoredMCQ[],
  "Energetics": ch08 as unknown as StoredMCQ[],
  "Chemical Equilibrium": ch09 as unknown as StoredMCQ[],
  "Acids, Bases, and Salts": ch10 as unknown as StoredMCQ[],
  "Environmental Chemistry – Air": ch11 as unknown as StoredMCQ[],
  "Environmental Chemistry – Water": ch12 as unknown as StoredMCQ[],
  "Organic Chemistry": ch13 as unknown as StoredMCQ[],
  "Hydrocarbons": ch14 as unknown as StoredMCQ[],
  "Biochemistry": ch15 as unknown as StoredMCQ[],
  "Empirical Data Collection and Analysis": ch16 as unknown as StoredMCQ[],
  "Separation Techniques": ch17 as unknown as StoredMCQ[],
  "Qualitative Analysis": ch18 as unknown as StoredMCQ[],
  "Chromatography": ch19 as unknown as StoredMCQ[],
};

export default chemistry;
