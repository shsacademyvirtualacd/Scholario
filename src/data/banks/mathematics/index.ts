import type { StoredMCQ } from "../../../types/questionBank";
import rawBankData from "../../grade9FbiseBank.json";

export const mathematics: Record<string, StoredMCQ[]> = (rawBankData as any).Mathematics || {};
export default mathematics;

