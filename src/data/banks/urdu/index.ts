import type { StoredMCQ } from "../../../types/questionBank";
import rawBankData from "../../grade9FbiseBank.json";

export const urdu: Record<string, StoredMCQ[]> = (rawBankData as any).Urdu || {};
export default urdu;

