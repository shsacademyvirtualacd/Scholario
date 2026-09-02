/**
 * Authoritative IELTS Curriculum Specification & Chapter Definitions
 * Single source of truth for all IELTS subjects, modules, chapters, and question bank metadata.
 */

import type { ChapterDef, FBISEGrade9SubjectCurriculum } from './curriculumFBISE9';
import { IELTS_READING_CHAPTERS } from '../data/banks/ielts/index';

export const IELTS_READING_ACADEMIC_CHAPTERS: ChapterDef[] = IELTS_READING_CHAPTERS.map((ch) => ({
  id: ch.id,
  number: ch.number,
  chapterNumber: ch.number,
  name: ch.name,
  subtopics: [
    'Matching headings to paragraphs',
    'Identifying True / False / Not Given & Yes / No / Not Given statements',
    'Information matching across paragraphs',
    'Sentence completion & detail retention',
    'Multiple choice factual comprehension',
    'Summary, note & table completion',
    'Identifying writer views, purpose & claims',
    'Academic vocabulary in contextual passage excerpts',
  ],
  description: `Authentic academic reading comprehension passage and analysis for ${ch.name}.`,
}));

export const IELTS_READING_GT_CHAPTERS: ChapterDef[] = IELTS_READING_CHAPTERS.map((ch) => ({
  id: ch.id.replace('read', 'gt-read'),
  number: ch.number,
  chapterNumber: ch.number,
  name: ch.name,
  subtopics: [
    'Workplace notices, guidelines & staff instructions',
    'Information retrieval from factual and descriptive texts',
    'Identifying True / False / Not Given statements',
    'Sentence completion and summary table filling',
    'Vocabulary in professional and community context',
  ],
  description: `General Training reading comprehension and analytical retention for ${ch.name}.`,
}));

export const IELTS_GRAMMAR_CHAPTERS: ChapterDef[] = [
  {
    id: 'ielts-gram-ch01',
    number: 1,
    chapterNumber: 1,
    name: 'Grammar & Sentence Structure',
    subtopics: [
      'Subject-Verb Agreement',
      'Tenses & Aspect (Present, Past, Perfect, Continuous)',
      'Conditionals (Zero, First, Second, Third, Inverted)',
      'Active & Passive Voice, Causative Structures',
      'Direct & Indirect Speech / Narration',
      'Modals & Semi-Modals of Probability and Obligation',
      'Articles (Definite, Indefinite, Zero Article)',
      'Prepositions, Phrasal Verbs & Collocations',
      'Relative Clauses & Pronoun References',
      'Inversion, Subjunctive Mood & Fronting',
      'Parallelism & Sentence Correction',
    ],
    description: 'Comprehensive grammatical accuracy and structural syntactic range for IELTS candidates.',
  },
];

export const IELTS_COMPREHENSION_CHAPTERS: ChapterDef[] = [
  {
    id: 'ielts-comp-ch01',
    number: 1,
    chapterNumber: 1,
    name: 'Comprehension of Passages',
    subtopics: [
      'Biomimicry & Environmental Architecture',
      'Linguistics, Universal Grammar & Cognitive Science',
      'Peatlands, Ecology & Carbon Sequestration',
      'Quantum Computing, Qubits & Superposition',
      'Deep-Sea Hydrothermal Vents & Chemosynthesis',
      'Archaeological Dating, Stratigraphy & Dendrochronology',
      'Behavioral Economics, Nudge Theory & Loss Aversion',
      'Urban Microclimates & Urban Heat Island Mitigation',
    ],
    description: 'Targeted analytical reading comprehension with authentic excerpts and evidence-based questions.',
  },
];

export const IELTS_LISTENING_CHAPTERS: ChapterDef[] = [
  {
    id: 'ielts-listen-ch01',
    number: 1,
    chapterNumber: 1,
    name: 'Section 1 (Social Conversation)',
    subtopics: ['Daily conversational English', 'Form filling & phone inquiries', 'Accommodation & travel bookings', 'Number, date & name spellings'],
    description: 'A conversation between two people set in an everyday social context.',
  },
  {
    id: 'ielts-listen-ch02',
    number: 2,
    chapterNumber: 2,
    name: 'Section 2 (Social Monologue)',
    subtopics: ['Local facility orientations', 'Public speeches & tourist guides', 'Map labelling & directional descriptions', 'Plan & flowchart completion'],
    description: 'A monologue set in an everyday social context (e.g. speech about local amenities).',
  },
  {
    id: 'ielts-listen-ch03',
    number: 3,
    chapterNumber: 3,
    name: 'Section 3 (Academic Discussion)',
    subtopics: ['University tutorial discussions', 'Research project evaluations', 'Assignment feedback & peer review', 'Multiple speaker viewpoints'],
    description: 'A conversation between up to four people set in an educational or training context.',
  },
  {
    id: 'ielts-listen-ch04',
    number: 4,
    chapterNumber: 4,
    name: 'Section 4 (Academic Lecture)',
    subtopics: ['University lecture excerpts', 'Scientific & historical presentations', 'Lecture note completion', 'Summary & outline synthesis'],
    description: 'A monologue on an academic subject (e.g. a university lecture).',
  },
];

export const IELTS_SPEAKING_CHAPTERS: ChapterDef[] = [
  {
    id: 'ielts-speak-ch01',
    number: 1,
    chapterNumber: 1,
    name: 'Part 1 (Introduction & Familiar Topics)',
    subtopics: ['Hometown & living environment', 'Studies, work & ambitions', 'Hobbies, leisure & daily routine', 'Fluency & natural responsiveness'],
    description: 'Introduction and interview on familiar general topics (4-5 minutes).',
  },
  {
    id: 'ielts-speak-ch02',
    number: 2,
    chapterNumber: 2,
    name: 'Part 2 (Individual Long Turn Cue Card)',
    subtopics: ['1-minute preparation strategy', '2-minute structured discourse management', 'Storytelling & descriptive coherence', 'Lexical resource & idiomatic expressions'],
    description: 'Individual long turn speaking on a given cue card task (3-4 minutes).',
  },
  {
    id: 'ielts-speak-ch03',
    number: 3,
    chapterNumber: 3,
    name: 'Part 3 (Two-Way Abstract Discussion)',
    subtopics: ['Abstract thematic discourse', 'Hypothetical speculating & hedging', 'Justifying opinions & comparing trends', 'Complex syntactic range & accuracy'],
    description: 'Two-way in-depth discussion linked to the Part 2 topic (4-5 minutes).',
  },
];

export const IELTS_WRITING_ACADEMIC_CHAPTERS: ChapterDef[] = [
  {
    id: 'ielts-write-acad-ch01',
    number: 1,
    chapterNumber: 1,
    name: 'Academic Task 1 (Data Synthesis)',
    subtopics: ['Bar charts, line graphs & pie charts', 'Tables & comparative matrices', 'Process diagrams & industrial cycles', 'Map changes & spatial developments'],
    description: 'Synthesizing, describing, and comparing visual data in at least 150 words.',
  },
  {
    id: 'ielts-write-acad-ch02',
    number: 2,
    chapterNumber: 2,
    name: 'Academic Task 2 (Discursive Essay)',
    subtopics: ['Opinion essays (Agree/Disagree)', 'Discussion essays (Both Views)', 'Problem & Solution essays', 'Advantages & Disadvantages essays'],
    description: 'Writing a formal discursive essay of at least 250 words in response to a point of view or argument.',
  },
];

export const IELTS_WRITING_GT_CHAPTERS: ChapterDef[] = [
  {
    id: 'ielts-write-gt-ch01',
    number: 1,
    chapterNumber: 1,
    name: 'GT Task 1 (Letters & Correspondence)',
    subtopics: ['Formal letters to institutions', 'Semi-formal workplace letters', 'Informal letters to friends/hosts', 'Standard salutations & closing sign-offs'],
    description: 'Writing a formal, semi-formal, or informal letter of at least 150 words.',
  },
  {
    id: 'ielts-write-gt-ch02',
    number: 2,
    chapterNumber: 2,
    name: 'GT Task 2 (General Essay)',
    subtopics: ['General social issue essays', 'Work-life balance & urban living', 'Consumer rights & public transport', 'Cohesion, coherence & paragraphing'],
    description: 'Writing a general essay of at least 250 words in response to a social issue or opinion.',
  },
];

export const IELTS_CURRICULUM: Record<string, FBISEGrade9SubjectCurriculum> = {
  'IELTS Reading (Academic)': {
    subject: 'IELTS Reading (Academic)',
    aliases: ['ielts reading (academic)', 'ielts reading', 'reading (academic)', 'academic reading', 'ielts reading academic'],
    guidelines: 'Passage-based academic reading comprehension assessing matching headings, T/F/NG, sentence completion, information matching, and writer views.',
    chapters: IELTS_READING_ACADEMIC_CHAPTERS,
  },
  'IELTS Reading (GT)': {
    subject: 'IELTS Reading (GT)',
    aliases: ['ielts reading (gt)', 'general training reading', 'ielts reading gt', 'gt reading'],
    guidelines: 'Passage-based reading comprehension assessing informational texts, instructions, articles, and workplace passages.',
    chapters: IELTS_READING_GT_CHAPTERS,
  },
  'Grammar': {
    subject: 'Grammar',
    aliases: ['grammar', 'english grammar', 'ielts grammar', 'grammar & sentence structure'],
    guidelines: 'Rigorous English syntax, tenses, subject-verb agreement, voice, inversion, conditionals, and error identification.',
    chapters: IELTS_GRAMMAR_CHAPTERS,
  },
  'Comprehension of Passages': {
    subject: 'Comprehension of Passages',
    aliases: ['comprehension of passages', 'reading comprehension', 'comprehension', 'ielts comprehension'],
    guidelines: 'Short authentic reading passages paired with deep inference, factual analysis, and contextual vocabulary questions.',
    chapters: IELTS_COMPREHENSION_CHAPTERS,
  },
  'IELTS Listening': {
    subject: 'IELTS Listening',
    aliases: ['ielts listening', 'listening', 'listening comprehension'],
    guidelines: '4 sections ranging from everyday social conversations to complex university lectures.',
    chapters: IELTS_LISTENING_CHAPTERS,
  },
  'IELTS Speaking': {
    subject: 'IELTS Speaking',
    aliases: ['ielts speaking', 'speaking', 'oral assessment'],
    guidelines: '3-part oral test assessing fluency, lexical resource, grammatical range, and pronunciation.',
    chapters: IELTS_SPEAKING_CHAPTERS,
  },
  'IELTS Writing (Academic)': {
    subject: 'IELTS Writing (Academic)',
    aliases: ['ielts writing (academic)', 'ielts writing', 'writing (academic)', 'academic writing'],
    guidelines: 'Task 1 data report synthesis (150 words) and Task 2 academic discursive essay (250 words).',
    chapters: IELTS_WRITING_ACADEMIC_CHAPTERS,
  },
  'IELTS Writing (GT)': {
    subject: 'IELTS Writing (GT)',
    aliases: ['ielts writing (gt)', 'general training writing', 'writing (gt)', 'gt writing'],
    guidelines: 'Task 1 correspondence letter (150 words) and Task 2 general issue essay (250 words).',
    chapters: IELTS_WRITING_GT_CHAPTERS,
  },
};

/** Check if board or grade represents IELTS */
export function isIELTSBoard(board?: string, grade?: string): boolean {
  const normBoard = String(board || '').trim().toLowerCase();
  const normGrade = String(grade || '').trim().toLowerCase();
  return (
    normBoard === 'ielts' ||
    normBoard.includes('ielts') ||
    normGrade === 'ielts' ||
    normGrade.includes('ielts')
  );
}

/** Get curriculum definition for IELTS subject */
export function getIELTSCurriculum(subject: string): FBISEGrade9SubjectCurriculum | undefined {
  if (IELTS_CURRICULUM[subject]) return IELTS_CURRICULUM[subject];
  const norm = subject.trim().toLowerCase();
  for (const item of Object.values(IELTS_CURRICULUM)) {
    if (item.subject.toLowerCase() === norm || item.aliases.some((a) => a.toLowerCase() === norm)) {
      return item;
    }
  }
  return undefined;
}

