import type { StoredMCQ } from "../../../types/questionBank";
import rawBankData from "../../grade9FbiseBank.json";

export const biology: Record<string, StoredMCQ[]> = (rawBankData as any).Biology || {};
export default biology;

