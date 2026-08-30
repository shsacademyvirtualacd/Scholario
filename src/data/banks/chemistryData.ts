import type { StoredMCQ } from "../../types/questionBank";
import chemistryJson from "./chemistryData.json";

export const chemistryMCQs: Record<string, StoredMCQ[]> = chemistryJson as Record<string, StoredMCQ[]>;

export default chemistryMCQs;
