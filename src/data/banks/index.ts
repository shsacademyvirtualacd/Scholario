import type { StoredMCQ, StoredShortQuestion, StoredLongQuestion } from '../../types/questionBank';
import { physicsMCQs } from './physicsData';
import { biologyMCQs } from './biologyData';
import { chemistryMCQs } from './chemistryData';
import { mathematicsMCQs } from './mathematicsData';
import { urduMCQs } from './urduData';
import { englishMCQs } from './englishData';

export type SubjectMCQBank = Record<string, StoredMCQ[]>;
export type FullGrade9Bank = Record<string, SubjectMCQBank>;

export const physics: SubjectMCQBank = physicsMCQs;
export const biology: SubjectMCQBank = biologyMCQs;
export const chemistry: SubjectMCQBank = chemistryMCQs;
export const mathematics: SubjectMCQBank = mathematicsMCQs;
export const urdu: SubjectMCQBank = urduMCQs;
export const english: SubjectMCQBank = englishMCQs;

/**
 * Authoritative merged Grade 9 FBISE Question Bank.
 */
export const grade9FbiseBank: FullGrade9Bank = {
  Physics: physicsMCQs,
  Biology: biologyMCQs,
  Chemistry: chemistryMCQs,
  Mathematics: mathematicsMCQs,
  Urdu: urduMCQs,
  English: englishMCQs,
};

export const grade9ShortQuestionsBank: Record<string, Record<string, StoredShortQuestion[]>> = {};
export const grade9LongQuestionsBank: Record<string, Record<string, StoredLongQuestion[]>> = {};

export default grade9FbiseBank;

