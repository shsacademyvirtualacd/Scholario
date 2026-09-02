import type { StoredMCQ } from '../../types/questionBank';
import physics from './physics/index';
import biology from './biology/index';
import chemistry from './chemistry/index';
import mathematics from './mathematics/index';
import urdu from './urdu/index';
import english from './english/index';
import {
  ieltsMasterBank,
  IELTS_READING_ACADEMIC_BANK,
  IELTS_READING_GT_BANK,
  IELTS_GRAMMAR_BANK,
  IELTS_COMPREHENSION_BANK,
  IELTS_LISTENING_BANK,
  IELTS_SPEAKING_BANK,
  IELTS_WRITING_ACAD_BANK,
  IELTS_WRITING_GT_BANK,
  IELTS_GRAMMAR_MCQS,
  IELTS_COMPREHENSION_MCQS,
  IELTS_READING_ACADEMIC_STORED,
  IELTS_READING_GT_STORED,
  ALL_IELTS_MCQS,
} from './ielts/index';

export type SubjectMCQBank = Record<string, StoredMCQ[]>;
export type FullGrade9Bank = Record<string, SubjectMCQBank>;

/**
 * Authoritative FBISE Grade 9 Question Bank.
 * Strictly scoped to FBISE Grade 9 curriculum subjects (Physics, Biology, Chemistry, Mathematics, Urdu, English).
 */
export const grade9FbiseBank: FullGrade9Bank = {
  Physics: physics as unknown as SubjectMCQBank,
  Biology: biology as unknown as SubjectMCQBank,
  Chemistry: chemistry as unknown as SubjectMCQBank,
  Mathematics: mathematics as unknown as SubjectMCQBank,
  Urdu: urdu as unknown as SubjectMCQBank,
  English: english as unknown as SubjectMCQBank,
};

/**
 * Authoritative IELTS Preparation Question Bank.
 * Strictly scoped to IELTS Preparation board & subjects.
 */
export const ieltsBank: Record<string, SubjectMCQBank> = ieltsMasterBank;

export {
  physics,
  biology,
  chemistry,
  mathematics,
  urdu,
  english,
  ieltsMasterBank,
  IELTS_READING_ACADEMIC_BANK,
  IELTS_READING_GT_BANK,
  IELTS_GRAMMAR_BANK,
  IELTS_COMPREHENSION_BANK,
  IELTS_LISTENING_BANK,
  IELTS_SPEAKING_BANK,
  IELTS_WRITING_ACAD_BANK,
  IELTS_WRITING_GT_BANK,
  IELTS_READING_ACADEMIC_STORED,
  IELTS_READING_GT_STORED,
  IELTS_GRAMMAR_MCQS,
  IELTS_COMPREHENSION_MCQS,
  ALL_IELTS_MCQS,
};

export default grade9FbiseBank;

