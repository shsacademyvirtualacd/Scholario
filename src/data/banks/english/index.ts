import type { StoredMCQ } from "../../../types/questionBank";
import rawBankData from "../../grade9FbiseBank.json";

export const english: Record<string, StoredMCQ[]> = (rawBankData as any).English || {};
export default english;

