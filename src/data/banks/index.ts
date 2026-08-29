import type { StoredMCQ, StoredShortQuestion, StoredLongQuestion } from '../../types/questionBank';
import physics from './physics';
import biology from './biology';
import chemistry from './chemistry';
import mathematics from './mathematics';
import urdu from './urdu';
import english from './english';

export type SubjectMCQBank = Record<string, StoredMCQ[]>;
export type FullGrade9Bank = Record<string, SubjectMCQBank>;

/**
 * Authoritative merged Grade 9 FBISE Question Bank.
 * Stored as separate per-subject JSON files for maximum reliability & version control safety,
 * merged dynamically at build/runtime.
 */
export const grade9FbiseBank: FullGrade9Bank = {
  Physics: physics as unknown as SubjectMCQBank,
  Biology: biology as unknown as SubjectMCQBank,
  Chemistry: chemistry as unknown as SubjectMCQBank,
  Mathematics: mathematics as unknown as SubjectMCQBank,
  Urdu: urdu as unknown as SubjectMCQBank,
  English: english as unknown as SubjectMCQBank,
};

export {
  physics,
  biology,
  chemistry,
  mathematics,
  urdu,
  english,
};

export default grade9FbiseBank;

export type SubjectShortBank = Record<string, StoredShortQuestion[]>;
export type FullGrade9ShortBank = Record<string, SubjectShortBank>;
export const grade9FbiseShortBank: FullGrade9ShortBank = {};

export type SubjectLongBank = Record<string, StoredLongQuestion[]>;
export type FullGrade9LongBank = Record<string, SubjectLongBank>;
export const grade9FbiseLongBank: FullGrade9LongBank = {};
