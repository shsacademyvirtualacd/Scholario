import type { StoredMCQ } from '../../types/questionBank';
import physics from './physics.json';
import biology from './biology.json';
import chemistry from './chemistry.json';
import mathematics from './mathematics.json';
import urdu from './urdu.json';
import english from './english.json';

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
