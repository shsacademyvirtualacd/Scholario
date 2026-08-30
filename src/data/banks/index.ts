import type { StoredMCQ, StoredShortQuestion, StoredLongQuestion } from '../../types/questionBank';
import rawBankData from '../grade9FbiseBank.json';

export type SubjectMCQBank = Record<string, StoredMCQ[]>;
export type FullGrade9Bank = Record<string, SubjectMCQBank>;

const typedBank = rawBankData as unknown as FullGrade9Bank;

/**
 * Authoritative merged Grade 9 FBISE Question Bank.
 */
export const grade9FbiseBank: FullGrade9Bank = typedBank;

export const physics: SubjectMCQBank = typedBank.Physics || {};
export const biology: SubjectMCQBank = typedBank.Biology || {};
export const chemistry: SubjectMCQBank = typedBank.Chemistry || {};
export const mathematics: SubjectMCQBank = typedBank.Mathematics || {};
export const urdu: SubjectMCQBank = typedBank.Urdu || {};
export const english: SubjectMCQBank = typedBank.English || {};

export const grade9ShortQuestionsBank: Record<string, Record<string, StoredShortQuestion[]>> = {};
export const grade9LongQuestionsBank: Record<string, Record<string, StoredLongQuestion[]>> = {};

export default grade9FbiseBank;

