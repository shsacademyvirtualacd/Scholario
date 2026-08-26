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

export const physics: Record<string, StoredMCQ[]> = {
  "Physical Quantities and Measurement": ch01 as unknown as StoredMCQ[],
  "Kinematics": ch02 as unknown as StoredMCQ[],
  "Pressure and Deformation in Solids": ch03 as unknown as StoredMCQ[],
  "Work and Energy": ch04 as unknown as StoredMCQ[],
  "Density and Temperature": ch05 as unknown as StoredMCQ[],
  "Magnetism": ch06 as unknown as StoredMCQ[],
  "Nature of Science and Physics": ch07 as unknown as StoredMCQ[],
  "Dynamics – I": ch08 as unknown as StoredMCQ[],
  "Dynamics – II": ch09 as unknown as StoredMCQ[],
};

export default physics;
