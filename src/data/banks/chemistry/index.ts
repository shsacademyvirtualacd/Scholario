import type { StoredMCQ } from "../../../types/questionBank";
import rawBankData from "../../grade9FbiseBank.json";

export const chemistry: Record<string, StoredMCQ[]> = (rawBankData as any).Chemistry || {};
export default chemistry;

