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

export const mathematics: Record<string, StoredMCQ[]> = {
  "Real Numbers": ch01 as unknown as StoredMCQ[],
  "Logarithms": ch02 as unknown as StoredMCQ[],
  "Sets and Relations": ch03 as unknown as StoredMCQ[],
  "Factorization and Algebraic Manipulation": ch04 as unknown as StoredMCQ[],
  "Linear Equations and Inequalities": ch05 as unknown as StoredMCQ[],
  "Trigonometry and Bearing": ch06 as unknown as StoredMCQ[],
  "Coordinate Geometry": ch07 as unknown as StoredMCQ[],
  "Geometry of Straight Lines": ch08 as unknown as StoredMCQ[],
  "Geometry and Polygons": ch09 as unknown as StoredMCQ[],
  "Practical Geometry": ch10 as unknown as StoredMCQ[],
  "Basic Statistics": ch11 as unknown as StoredMCQ[],
};

export default mathematics;
