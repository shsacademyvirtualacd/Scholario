const fs = require('fs');
const path = require('path');

const part1 = require('./data/englishTenMorePart1.cjs');
const part2 = require('./data/englishTenMorePart2.cjs');
const part3 = require('./data/englishTenMorePart3.cjs');

const allTenMoreEnglish = {
  ...part1,
  ...part2,
  ...part3,
};

const { safeWriteQuestionBank } = require('./utils/safeJsonWriter.cjs');

const JSON_PATH = path.resolve(__dirname, '../src/data/grade9FbiseBank.json');
const raw = fs.readFileSync(JSON_PATH, 'utf-8');
const bank = JSON.parse(raw);

const now = new Date().toISOString();

const englishChaptersMeta = [
  { num: 1, name: 'Parts of Speech', subtopic: 'Nouns, Pronouns, Verbs, Adjectives, Adverbs, Prepositions' },
  { num: 2, name: 'Tenses (all forms)', subtopic: 'Present, Past, Future tenses and time markers' },
  { num: 3, name: 'Active & Passive Voice', subtopic: 'Active and Passive transformations across all tenses and moods' },
  { num: 4, name: 'Direct & Indirect Narration', subtopic: 'Direct to Indirect speech, reporting verbs and backshifting' },
  { num: 5, name: 'Sentence Correction', subtopic: 'Grammar mechanics, agreement, parallelism, and modifiers' },
  { num: 6, name: 'Types of Sentences', subtopic: 'Simple, Compound, Complex, Declarative, Interrogative, Conditionals' },
  { num: 7, name: 'Subject-Verb Agreement', subtopic: 'Rules of proximity, collective nouns, compound subjects' },
  { num: 8, name: 'Prepositions', subtopic: 'Prepositions of time, place, direction, and dependent prepositions' },
  { num: 9, name: 'Conjunctions', subtopic: 'Coordinating, Subordinating, and Correlative conjunctions' },
  { num: 10, name: 'Articles', subtopic: 'Indefinite, Definite, and Zero articles usage' },
  { num: 11, name: 'Punctuation', subtopic: 'Commas, semicolons, colons, apostrophes, capitalization' },
  { num: 12, name: 'Modals/Auxiliary Verbs', subtopic: 'Ability, permission, obligation, deduction, semi-modals' },
  { num: 13, name: 'Clauses', subtopic: 'Independent, Noun, Adjective, and Adverbial clauses' },
  { num: 14, name: 'Degrees of Comparison', subtopic: 'Positive, comparative, and superlative transformations' },
  { num: 15, name: 'Vocabulary & Comprehension', subtopic: 'Synonyms, antonyms, one-word substitutions, context clues' },
  { num: 16, name: 'Idioms & Phrases', subtopic: 'Meanings, idioms, proverbs, and phrasal verbs' },
  { num: 17, name: 'Word Formation (Prefixes/Suffixes)', subtopic: 'Prefixes, suffixes, derivations, and compound words' },
];

if (!bank.English) {
  console.error('ERROR: English key missing in bank!');
  process.exit(1);
}

let totalAppended = 0;
for (const meta of englishChaptersMeta) {
  const chapName = meta.name;
  const existingQuestions = bank.English[chapName];
  if (!existingQuestions) {
    console.error(`ERROR: Chapter "${chapName}" not found in bank.English!`);
    process.exit(1);
  }

  if (existingQuestions.length !== 40) {
    console.warn(`WARNING: Chapter "${chapName}" currently has ${existingQuestions.length} questions (expected 40 before append).`);
  }

  const newTen = allTenMoreEnglish[chapName];
  if (!newTen || newTen.length !== 10) {
    console.error(`ERROR: New questions list for "${chapName}" has ${newTen ? newTen.length : 0} questions (expected 10)!`);
    process.exit(1);
  }

  const difficulties = ['easy', 'medium', 'medium', 'hard'];
  const startIndex = existingQuestions.length; // usually 40

  const formattedNewQuestions = newTen.map((qItem, idx) => {
    const qNum = startIndex + idx + 1;
    return {
      id: `fbise9_eng_ch${meta.num}_q${qNum}`,
      board: 'fbise',
      grade: '9',
      subject: 'English',
      chapter: chapName,
      chapterNumber: meta.num,
      topic: meta.subtopic,
      question: qItem.q,
      options: {
        A: qItem.A,
        B: qItem.B,
        C: qItem.C,
        D: qItem.D,
      },
      correctAnswer: qItem.ans,
      explanation: qItem.exp,
      difficulty: difficulties[idx % difficulties.length],
      verified: true,
      source: 'curriculum-bank',
      createdAt: now,
    };
  });

  // Strict append-only to existing questions
  bank.English[chapName] = [...existingQuestions, ...formattedNewQuestions];
  totalAppended += formattedNewQuestions.length;
}

// Write back with safe formatting
safeWriteQuestionBank(JSON_PATH, bank);
console.log(`Successfully appended ${totalAppended} new English questions across ${englishChaptersMeta.length} topics.`);
