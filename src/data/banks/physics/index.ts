import type { StoredMCQ } from "../../../types/questionBank";
import rawBankData from "../../grade9FbiseBank.json";

export const physics: Record<string, StoredMCQ[]> = (rawBankData as any).Physics || {};
export default physics;

